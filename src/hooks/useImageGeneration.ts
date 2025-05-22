import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatStylePrompt } from "@/lib/huggingface";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export const useImageGeneration = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [requiresApiKey, setRequiresApiKey] = useState(false);
  const [currentFigurineId, setCurrentFigurineId] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate image using the Edge Function
  const handleGenerate = async (prompt: string, style: string, apiKey: string = "") => {
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey") || apiKey;
    
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setModelUrl(null);
    setCurrentFigurineId(null);
    
    try {
      // Call our edge function
      const response = await fetch(`${window.location.origin}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({ 
          prompt,
          style,
          apiKey: savedApiKey
        }),
      });
      
      // Handle authentication errors
      if (response.status === 401) {
        setRequiresApiKey(true);
        throw new Error("API key required or unauthorized access");
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }
      
      // We don't need an API key anymore if we got a successful response
      setRequiresApiKey(false);
      
      // Process the response - if it's JSON with an error, handle it
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const errorData = await response.json();
        if (!errorData.success) {
          throw new Error(errorData.error || "Failed to generate image");
        }
      }
      
      // Otherwise, it's an image, so create a blob URL
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
      
      // Save the figurine to Supabase if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // We'll need to upload the image to storage in a real app
        // For now, just save the reference
        const figurineId = uuidv4();
        setCurrentFigurineId(figurineId);
        
        await supabase.from('figurines').insert({
          id: figurineId,
          user_id: session.user.id,
          prompt: prompt,
          style: style as any, // Match the enum type
          image_url: imageUrl, // In real app, upload to Supabase Storage
          title: prompt.substring(0, 50) // Use part of the prompt as title
        });
      }
      
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
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('figurines').update({
              model_url: dummyModelUrl
            }).eq('id', currentFigurineId);
          }
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
