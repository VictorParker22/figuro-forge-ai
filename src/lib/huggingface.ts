
// This file contains functions for interacting with the Hugging Face API

/**
 * Generate an image using the FLUX.1 model with specified prompt and style
 */
export const generateImage = async (prompt: string, style: string, apiKey: string): Promise<string> => {
  // Format the prompt based on the style
  const formattedPrompt = formatStylePrompt(prompt, style);
  
  // Determine if we should use a specific LoRA adapter
  const useLoraAdapter = style === "isometric" ? "multimodalart/isometric-skeumorphic-3d-bnb" : undefined;
  
  // Make the API request
  const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      inputs: formattedPrompt,
      options: {
        use_lora: !!useLoraAdapter,
        lora_weights: useLoraAdapter
      }
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText || response.statusText}`);
  }
  
  // Convert the response to a blob and create a URL
  const blob = await response.blob();
  const imageUrl = URL.createObjectURL(blob);
  
  return imageUrl;
};

/**
 * Format a prompt according to the selected style
 */
export const formatStylePrompt = (basePrompt: string, style: string): string => {
  switch (style) {
    case "isometric":
      return `${basePrompt}, RBNBICN, icon, white background, isometric perspective`;
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
 * Convert an image to a 3D model
 * Note: This is a placeholder for a real implementation
 */
export const convertImageTo3D = async (imageUrl: string, apiKey: string): Promise<string> => {
  // In a real implementation, this would call a 3D conversion API
  // For now, we're just returning a placeholder
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("dummy-3d-model-url");
    }, 2000);
  });
};
