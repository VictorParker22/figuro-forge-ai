
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
    
    // Handle authentication errors
    if (response.status === 401) {
      return { 
        blob: null, 
        url: null,
        error: "API key required or unauthorized access"
      };
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }
    
    // Process the response - if it's JSON with an error, handle it
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const errorData = await response.json();
      if (!errorData.success) {
        throw new Error(errorData.error || "Failed to generate image");
      }
    }
    
    // Otherwise, it's an image, so create a blob
    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    
    return { blob: imageBlob, url: imageUrl };
  } catch (error) {
    console.error("Generation error:", error);
    return { 
      blob: null, 
      url: null,
      error: error instanceof Error ? error.message : "Failed to generate image" 
    };
  }
};
