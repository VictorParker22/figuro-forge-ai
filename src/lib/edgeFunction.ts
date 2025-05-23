
/**
 * This module provides edge function utilities for generating images
 * using the Hugging Face API with optimization for edge computing
 */

import { addCorsProxy } from "@/utils/corsProxy";

type ImageGenerationOptions = {
  prompt: string;
  style: string;
  apiKey?: string;
};

type ImageGenerationResult = {
  success: boolean;
  imageUrl?: string;
  error?: string;
  needsApiKey: boolean;
};

/**
 * Generate an image using the Hugging Face API with edge computing optimization
 * @param options Configuration for image generation
 * @returns Result object with generated image URL or error
 */
export const generateImageWithEdge = async (
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> => {
  const { prompt, style, apiKey } = options;
  
  try {
    // Format the prompt based on the selected style
    const formattedPrompt = formatEdgePrompt(prompt, style);
    
    // Determine if we should use a specific LoRA adapter
    const useLoraAdapter = style === "isometric" ? "multimodalart/isometric-skeumorphic-3d-bnb" : undefined;
    
    // Create headers with or without API key
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    // Add CORS proxy to the API endpoint
    const apiEndpoint = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev";
    const proxiedEndpoint = addCorsProxy(apiEndpoint);
    
    // Make the API request with edge optimization and CORS proxy
    const response = await fetch(proxiedEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        inputs: formattedPrompt,
        options: {
          use_lora: !!useLoraAdapter,
          lora_weights: useLoraAdapter
        }
      }),
    });
    
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: "API key required or unauthorized access",
        needsApiKey: true
      };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText || response.statusText}`);
    }
    
    // Process the image data
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    
    return {
      success: true,
      imageUrl,
      needsApiKey: false
    };
  } catch (error) {
    console.error("Edge function error:", error);
    
    // Check if the error is about API key
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const needsApiKey = errorMessage.includes("API key") || errorMessage.includes("unauthorized");
    
    return {
      success: false,
      error: errorMessage,
      needsApiKey
    };
  }
};

/**
 * Format a prompt for edge-optimized processing
 */
export const formatEdgePrompt = (basePrompt: string, style: string): string => {
  switch (style) {
    case "isometric":
      return `${basePrompt}, RBNBICN, icon, white background, isometric perspective, 3D-like, clean lines, detailed, professional design, high quality`;
    case "anime":
      return `${basePrompt}, anime style, vibrant colors, white background`;
    case "pixar":
      return `${basePrompt}, pixar style, 3D character, white background`;
    case "steampunk":
      return `${basePrompt}, steampunk style, brass gears, vintage, white background`;
    case "lowpoly":
      return `${basePrompt}, low poly 3D model, geometric, white background`;
    case "cyberpunk":
      return `${basePrompt}, cyberpunk style, neon colors, futuristic, white background`;
    case "realistic":
      return `${basePrompt}, realistic 3D render, detailed texture, white background`;
    case "chibi":
      return `${basePrompt}, chibi style, cute, small body, big head, white background`;
    default:
      return `${basePrompt}, 3D figurine, white background`;
  }
};

/**
 * Optimize a generated image for edge delivery
 * @param imageUrl URL of the generated image
 * @returns Optimized image URL
 */
export const optimizeImageForEdge = (imageUrl: string): string => {
  // In a real implementation, this would apply edge-specific optimizations
  return imageUrl;
};
