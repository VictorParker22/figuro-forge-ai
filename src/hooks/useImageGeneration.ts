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
  const [generationsLeft, setGenerationsLeft] = useState<number | null>(null);
  const { toast } = useToast();

  // Check for remaining generations when user authenticates
  useEffect(() => {
    const checkRemainingGenerations = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('generation_count')
          .eq('id', session.user.id)
          .single();
          
        if (data) {
          // Users are allowed 4 generations
          setGenerationsLeft(Math.max(0, 4 - data.generation_count));
        }
      }
    };

    checkRemainingGenerations();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkRemainingGenerations();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save image to storage and update figurine record
  const saveImageToStorage = async (imageBlob: Blob, figurineId: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      
      const filePath = `${session.user.id}/${figurineId}.png`;
      
      // Upload image to storage
      const { data, error } = await supabase.storage
        .from('figurine-images')
        .upload(filePath, imageBlob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('figurine-images')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Failed to save image to storage:', error);
      return null;
    }
  };

  // Generate image using the Edge Function or directly
  const handleGenerate = async (prompt: string, style: string, apiKey: string = "", preGeneratedImageUrl?: string) => {
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey") || apiKey;
    
    // Check if user has reached their generation limit
    if (generationsLeft !== null && generationsLeft <= 0) {
      toast({
        title: "Generation limit reached",
        description: "You've reached your limit of 4 generated images.",
        variant: "destructive",
      });
      return { success: false, limitReached: true };
    }
    
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
        
        // Otherwise, it's an image, so create a blob
        imageBlob = await response.blob();
        imageUrl = URL.createObjectURL(imageBlob);
        setGeneratedImage(imageUrl);
      }
      
      // Save the figurine to Supabase if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Generate a new ID for the figurine
        const figurineId = uuidv4();
        setCurrentFigurineId(figurineId);
        
        // Save image to storage if we have a blob
        let savedImageUrl = null;
        if (imageBlob) {
          savedImageUrl = await saveImageToStorage(imageBlob, figurineId);
        }
        
        // Insert new figurine
        await supabase.from('figurines').insert({
          id: figurineId,
          user_id: session.user.id,
          prompt: prompt,
          style: style as any,
          image_url: imageUrl,
          saved_image_url: savedImageUrl,
          title: prompt.substring(0, 50)
        });
        
        // Update generation count
        await supabase.from('profiles')
          .update({ generation_count: supabase.rpc('increment', { inc_amount: 1 }) })
          .eq('id', session.user.id);
        
        // Update generations left
        if (generationsLeft !== null) {
          setGenerationsLeft(Math.max(0, generationsLeft - 1));
        }
      }
      
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
    currentFigurineId,
    generationsLeft
  };
};
