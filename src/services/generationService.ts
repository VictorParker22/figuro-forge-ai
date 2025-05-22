import { formatStylePrompt } from "@/lib/huggingface";
import { SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

// Generate image using edge function
export const generateImage = async (prompt: string, style: string, apiKey: string = ""): Promise<{blob: Blob | null, url: string | null, error?: string}> => {
  try {
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
      return { 
        blob: null, 
        url: null,
        error: "Edge function not found. Please make sure the function is deployed."
      };
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      return { 
        blob: null, 
        url: null,
        error: "API key required or unauthorized access"
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
          return { blob: null, url: jsonData.url };
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
      
      return { blob: imageBlob, url: imageUrl };
    } catch (blobError) {
      throw new Error(`Failed to process image data: ${blobError.message}`);
    }
  } catch (error) {
    console.error("Generation error:", error);
    return { 
      blob: null, 
      url: null,
      error: error instanceof Error ? error.message : "Failed to generate image" 
    };
  }
};
