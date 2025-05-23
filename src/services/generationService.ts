
import { formatStylePrompt } from "@/lib/huggingface";
import { SUPABASE_PUBLISHABLE_KEY, supabase } from "@/integrations/supabase/client";
import { generateImageWithEdge } from "@/lib/edgeFunction";

// Track if the edge function is available
let isEdgeFunctionAvailable: boolean | null = null;

// Simple circuit breaker implementation
const getEdgeFunctionStatus = (): boolean => {
  // Check localStorage first
  const storedStatus = localStorage.getItem("edgeFunctionAvailable");
  if (storedStatus !== null) {
    return storedStatus === "true";
  }
  
  // Default to assuming it's available if we haven't checked yet
  return isEdgeFunctionAvailable !== false;
};

const setEdgeFunctionStatus = (isAvailable: boolean): void => {
  isEdgeFunctionAvailable = isAvailable;
  localStorage.setItem("edgeFunctionAvailable", isAvailable.toString());
  
  // If it's not available, set a timeout to reset after 1 hour (circuit breaker reset)
  if (!isAvailable) {
    setTimeout(() => {
      localStorage.removeItem("edgeFunctionAvailable");
      isEdgeFunctionAvailable = null;
    }, 60 * 60 * 1000); // 1 hour
  }
};

// Increment the global stats counter
const incrementImageGenerationCount = async (): Promise<void> => {
  try {
    // First try to use the increment edge function
    const response = await fetch(`${window.location.origin}/functions/v1/increment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY || ''}`
      },
      body: JSON.stringify({ 
        table_name: 'stats',
        id: 'image_generations',
      }),
    });
    
    // If the function call failed, try to increment directly using the Supabase client
    if (!response.ok) {
      console.warn("Failed to increment counter via edge function, trying direct method");
      
      // Try to update using the RPC function
      const { data, error } = await supabase
        .rpc('increment_stat', {
          stat_id: 'image_generations',
          inc_amount: 1
        });
        
      if (error) {
        throw new Error(`Failed to increment counter: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Failed to increment generation counter:", error);
    // Silently fail - don't block the rest of the application for counter issues
  }
};

// Generate image using edge function
export const generateImage = async (prompt: string, style: string, apiKey: string = ""): Promise<{blob: Blob | null, url: string | null, error?: string, method: "edge" | "direct"}> => {
  try {
    // Check if we should attempt using the edge function
    if (getEdgeFunctionStatus()) {
      console.log("Attempting image generation using Edge Function...");
      
      try {
        // Try the edge function
        const response = await fetch(`${window.location.origin}/functions/v1/generate-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY || ''}`
          },
          body: JSON.stringify({ 
            prompt,
            style,
            apiKey
          }),
        });
        
        // Handle 404 errors (edge function not deployed)
        if (response.status === 404) {
          console.warn("Edge function not found, marking as unavailable");
          setEdgeFunctionStatus(false);
          throw new Error("Edge function not available");
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          return { 
            blob: null, 
            url: null,
            error: "API key required or unauthorized access",
            method: "edge"
          };
        }
        
        if (!response.ok) {
          // Try to get error message from response if it's JSON
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `API error: ${response.statusText}`);
          } catch (jsonError) {
            // If parsing fails, just use the status text
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }
        
        // Mark edge function as available since it worked
        setEdgeFunctionStatus(true);
        
        // Process the response - check content type first
        const contentType = response.headers.get("Content-Type") || "";
        
        // If it's JSON, handle it as JSON
        if (contentType.includes("application/json")) {
          try {
            const jsonData = await response.json();
            if (!jsonData.success) {
              throw new Error(jsonData.error || "Failed to generate image");
            }
            
            // Check if the JSON contains an image URL
            if (jsonData.url) {
              // Increment the image generation counter
              await incrementImageGenerationCount();
              return { blob: null, url: jsonData.url, method: "edge" };
            } else {
              throw new Error("No image data returned");
            }
          } catch (jsonError) {
            throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
          }
        }
        
        // Otherwise, it's an image, so create a blob
        try {
          const imageBlob = await response.blob();
          const imageUrl = URL.createObjectURL(imageBlob);
          
          // Increment the image generation counter
          await incrementImageGenerationCount();
          
          return { blob: imageBlob, url: imageUrl, method: "edge" };
        } catch (blobError) {
          throw new Error(`Failed to process image data: ${blobError.message}`);
        }
      } catch (edgeFunctionError) {
        console.warn("Edge function failed:", edgeFunctionError);
        // Fall through to direct API call
      }
    }
    
    // If edge function isn't available or failed, use direct API
    console.log("Using direct API call via edgeFunction.ts...");
    const edgeResult = await generateImageWithEdge({
      prompt,
      style, 
      apiKey
    });
    
    if (!edgeResult.success) {
      return { 
        blob: null, 
        url: null,
        error: edgeResult.error || "Failed to generate image with fallback method",
        method: "direct"
      };
    }
    
    if (edgeResult.imageUrl) {
      // Fetch the blob from the URL
      const blobResponse = await fetch(edgeResult.imageUrl);
      const blob = await blobResponse.blob();
      
      // Increment the image generation counter
      await incrementImageGenerationCount();
      
      return {
        blob,
        url: edgeResult.imageUrl,
        method: "direct"
      };
    }
    
    return { 
      blob: null, 
      url: null,
      error: "No image URL returned from fallback API",
      method: "direct"
    };
  } catch (error) {
    console.error("Generation error:", error);
    return { 
      blob: null, 
      url: null,
      error: error instanceof Error ? error.message : "Failed to generate image",
      method: "direct"
    };
  }
};
