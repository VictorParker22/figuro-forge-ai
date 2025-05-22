
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatStylePrompt } from "@/lib/huggingface";

export const useImageGeneration = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [requiresApiKey, setRequiresApiKey] = useState(false);
  const { toast } = useToast();

  // Generate image using the Hugging Face API
  const handleGenerate = async (prompt: string, style: string, apiKey: string = "") => {
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey") || apiKey;
    
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setModelUrl(null);
    
    const formattedPrompt = formatStylePrompt(prompt, style);
    
    try {
      // Try without API key first if none is provided
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Add API key to headers if available
      if (savedApiKey) {
        headers["Authorization"] = `Bearer ${savedApiKey}`;
      }
      
      const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          inputs: formattedPrompt,
          options: {
            use_lora: true,
            lora_weights: style === "isometric" ? "multimodalart/isometric-skeumorphic-3d-bnb" : undefined
          }
        }),
      });
      
      if (response.status === 401 || response.status === 403) {
        setRequiresApiKey(true);
        throw new Error("API key required or unauthorized access");
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      // If we get here, we don't need an API key anymore
      setRequiresApiKey(false);
      
      // Convert the response to a blob and create a URL
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
      
      toast({
        title: "Image generated",
        description: `Created "${prompt}" in ${style} style`,
      });
      
      return { success: true, needsApiKey: false };
    } catch (error) {
      console.error("Generation error:", error);
      
      // Check if the error is about API key
      if (error instanceof Error && (error.message.includes("API key") || error.message.includes("unauthorized"))) {
        setRequiresApiKey(true);
        return { success: false, needsApiKey: true };
      }
      
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
      
      return { success: false, needsApiKey: requiresApiKey };
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Simulate 3D conversion
  const handleConvertTo3D = () => {
    setIsConverting(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, this would call another API or model
      setModelUrl("dummy-model-url");
      setIsConverting(false);
      toast({
        title: "3D model created",
        description: "Your figurine is ready to view in 3D",
      });
    }, 3000);
  };

  return {
    isGeneratingImage,
    isConverting,
    generatedImage,
    modelUrl,
    handleGenerate,
    handleConvertTo3D,
    requiresApiKey
  };
};
