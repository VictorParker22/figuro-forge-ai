import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveFigurine, updateFigurineWithModelUrl } from "@/services/figurineService";
import { generateImage } from "@/services/generationService";
import { supabase } from "@/integrations/supabase/client";

export const useImageGeneration = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [requiresApiKey, setRequiresApiKey] = useState(false);
  const [currentFigurineId, setCurrentFigurineId] = useState<string | null>(null);
  const [generationMethod, setGenerationMethod] = useState<"edge" | "direct" | null>(null);
  const { toast } = useToast();

  // Helper function to convert image to base64
  const imageUrlToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract just the base64 part without the data URL prefix
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  };

  // Generate image using a single generation attempt strategy
  const handleGenerate = async (prompt: string, style: string, apiKey: string = "", preGeneratedImageUrl?: string) => {
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey") || apiKey;
    
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setModelUrl(null);
    setCurrentFigurineId(null);
    setGenerationMethod(null);
    
    try {
      let imageUrl: string | null = null;
      let imageBlob: Blob | null = null;

      // Use the pre-generated image URL if provided
      if (preGeneratedImageUrl) {
        imageUrl = preGeneratedImageUrl;
        setGenerationMethod("edge"); // Assume it came from edge if pre-generated
        
        // Fetch the blob from the URL for storage
        const response = await fetch(preGeneratedImageUrl);
        imageBlob = await response.blob();
      } else {
        // Make a single generation request to the service layer
        console.log("Making single generation request to service layer");
        const result = await generateImage(prompt, style, savedApiKey);
        
        if (result.error) {
          // Check if the error is about API key
          if (result.error.includes("API key") || result.error.includes("unauthorized")) {
            setRequiresApiKey(true);
            return { success: false, needsApiKey: true };
          }
          
          throw new Error(result.error);
        }
        
        setGenerationMethod(result.method);
        
        // We don't need an API key anymore if we got a successful response
        setRequiresApiKey(false);
        
        imageBlob = result.blob;
        imageUrl = result.url;
      }
      
      // Save the figurine to Supabase if we have an image
      if (imageUrl) {
        setGeneratedImage(imageUrl);
        
        toast({
          title: "Image generated",
          description: `Created "${prompt}" in ${style} style using ${generationMethod || "API"} method`,
        });
        
        const figurineId = await saveFigurine(prompt, style, imageUrl, imageBlob);
        
        if (figurineId) {
          setCurrentFigurineId(figurineId);
        }
      }
      
      return { success: true, needsApiKey: false };
    } catch (error) {
      console.error("Generation error:", error);
      
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

  // Convert image to 3D model using Meshy.ai API
  const handleConvertTo3D = async () => {
    if (!generatedImage) {
      toast({
        title: "No image to convert",
        description: "Please generate an image first",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    
    try {
      // Check if the image URL is a blob URL
      const isBlobUrl = generatedImage.startsWith('blob:');
      let requestBody: any = {};
      
      if (isBlobUrl) {
        console.log("Converting blob URL to base64...");
        const base64Data = await imageUrlToBase64(generatedImage);
        if (!base64Data) {
          throw new Error("Failed to convert image to base64");
        }
        requestBody = { imageBase64: base64Data };
      } else {
        // Use the URL directly
        requestBody = { imageUrl: generatedImage };
      }
      
      console.log("Sending conversion request to edge function...");
      
      // Call our Supabase Edge Function to convert the image to 3D
      const response = await fetch(`${window.location.origin}/functions/v1/convert-to-3d`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to convert image to 3D model";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.modelUrl) {
        throw new Error("No model URL returned from conversion service");
      }
      
      // Set the model URL in state
      setModelUrl(data.modelUrl);
      
      // Update figurine with model URL if we have one
      if (currentFigurineId) {
        await updateFigurineWithModelUrl(currentFigurineId, data.modelUrl);
      }
      
      toast({
        title: "3D model created",
        description: "Your figurine is ready to view in 3D",
      });
    } catch (error) {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Failed to convert to 3D model",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return {
    isGeneratingImage,
    isConverting,
    generatedImage,
    modelUrl,
    handleGenerate,
    handleConvertTo3D,
    requiresApiKey,
    currentFigurineId,
    generationMethod
  };
};
