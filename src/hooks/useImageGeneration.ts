import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { incrementGenerationCount } from "@/services/profileService";
import { saveFigurine, updateFigurineWithModelUrl } from "@/services/figurineService";
import { generateImage } from "@/services/generationService";

export const useImageGeneration = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [requiresApiKey, setRequiresApiKey] = useState(false);
  const [currentFigurineId, setCurrentFigurineId] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate image using the Edge Function or directly
  const handleGenerate = async (prompt: string, style: string, apiKey: string = "", preGeneratedImageUrl?: string) => {
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey") || apiKey;
    
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setModelUrl(null);
    setCurrentFigurineId(null);
    
    try {
      let imageUrl: string | null = null;
      let imageBlob: Blob | null = null;

      // Use the pre-generated image URL if provided
      if (preGeneratedImageUrl) {
        imageUrl = preGeneratedImageUrl;
        
        // Fetch the blob from the URL for storage
        const response = await fetch(preGeneratedImageUrl);
        imageBlob = await response.blob();
      } else {
        // Otherwise call the edge function
        const result = await generateImage(prompt, style, savedApiKey);
        
        if (result.error) {
          // Check if the error is about API key
          if (result.error.includes("API key") || result.error.includes("unauthorized")) {
            setRequiresApiKey(true);
            return { success: false, needsApiKey: true };
          }
          
          throw new Error(result.error);
        }
        
        // We don't need an API key anymore if we got a successful response
        setRequiresApiKey(false);
        
        imageBlob = result.blob;
        imageUrl = result.url;
        if (imageUrl) {
          setGeneratedImage(imageUrl);
        }
      }
      
      // Save the figurine to Supabase if we have an image
      if (imageUrl) {
        const figurineId = await saveFigurine(prompt, style, imageUrl, imageBlob);
        
        if (figurineId) {
          setCurrentFigurineId(figurineId);
          
          // Update the generation count
          await incrementGenerationCount();
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

  // Convert image to 3D model
  const handleConvertTo3D = async () => {
    setIsConverting(true);
    
    try {
      // Simulate API call with timeout
      setTimeout(async () => {
        // In a real app, this would call another API or model
        const dummyModelUrl = "dummy-model-url";
        setModelUrl(dummyModelUrl);
        
        // Update figurine with model URL if we have one
        if (currentFigurineId) {
          await updateFigurineWithModelUrl(currentFigurineId, dummyModelUrl);
        }
        
        setIsConverting(false);
        toast({
          title: "3D model created",
          description: "Your figurine is ready to view in 3D",
        });
      }, 3000);
    } catch (error) {
      setIsConverting(false);
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Failed to convert to 3D model",
        variant: "destructive",
      });
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
    currentFigurineId
  };
};
