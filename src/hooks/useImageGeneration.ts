
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveFigurine, updateFigurineWithModelUrl } from "@/services/figurineService";
import { generateImage } from "@/services/generationService";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export const useImageGeneration = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [requiresApiKey, setRequiresApiKey] = useState(false);
  const [currentFigurineId, setCurrentFigurineId] = useState<string | null>(null);
  const [generationMethod, setGenerationMethod] = useState<"edge" | "direct" | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentTaskRef = useRef<string | null>(null);
  const modelUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Update the ref when modelUrl changes
  useEffect(() => {
    modelUrlRef.current = modelUrl;
  }, [modelUrl]);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

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

  // Set up SSE connection for real-time updates on conversion
  const setupSSEConnection = (taskId: string) => {
    // Store the current task ID
    currentTaskRef.current = taskId;
    
    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const sseUrl = `${SUPABASE_URL}/functions/v1/check-3d-status?taskId=${taskId}&sse=true`;
    console.log(`Setting up SSE connection to: ${sseUrl}`);

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    // Handle connection open
    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    // Handle connection error
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      
      // Don't set an error if we already have a model URL
      if (!modelUrlRef.current) {
        // Start polling as a fallback if SSE connection fails
        pollTaskStatus(taskId);
      }
      
      eventSource.close();
      eventSourceRef.current = null;
    };

    // Handle general messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE message received:', data);
        
        // Update progress if available
        if (data.progress !== undefined) {
          setConversionProgress(data.progress);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    // Handle specific events
    eventSource.addEventListener('connected', (event: any) => {
      console.log('SSE connected event:', event.data ? JSON.parse(event.data) : event);
    });

    eventSource.addEventListener('status', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE status update:', data);
        
        // Update progress
        if (data.progress !== undefined) {
          setConversionProgress(data.progress);
        }
      } catch (error) {
        console.error('Error parsing SSE status:', error);
      }
    });

    eventSource.addEventListener('processing', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE processing update:', data);
        setConversionProgress(data.progress || 0);
      } catch (error) {
        console.error('Error parsing SSE processing event:', error);
      }
    });

    eventSource.addEventListener('completed', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE completed event:', data);
        
        // Handle completion
        if (data.modelUrl) {
          setModelUrl(data.modelUrl);
          setIsConverting(false);
          setConversionProgress(100);
          setConversionError(null); // Clear any existing errors
          
          toast({
            title: "3D model created",
            description: "Your figurine is ready to view in 3D",
          });
          
          // Update figurine with model URL if we have one
          if (currentFigurineId) {
            updateFigurineWithModelUrl(currentFigurineId, data.modelUrl);
          }
          
          // Close the connection as we're done
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (error) {
        console.error('Error parsing SSE completed event:', error);
      }
    });

    eventSource.addEventListener('failed', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        console.error('SSE failure event:', data);
        
        // Only set error if we don't already have a model URL
        if (!modelUrlRef.current) {
          const errorMessage = data.error || data.details || 'Conversion failed';
          setConversionError(errorMessage);
          
          toast({
            title: "Conversion failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
        
        setIsConverting(false);
        
        // Close the connection as we're done
        eventSource.close();
        eventSourceRef.current = null;
      } catch (error) {
        console.error('Error parsing SSE failed event:', error);
      }
    });

    eventSource.addEventListener('error', (event: any) => {
      try {
        let errorData;
        try {
          errorData = event.data ? JSON.parse(event.data) : { error: 'Unknown error' };
        } catch (e) {
          errorData = { error: 'Unknown error' };
        }
        console.error('SSE error event:', errorData);
        
        // Don't set error if we already have a model URL
        if (!modelUrlRef.current) {
          // Check task status directly as fallback
          pollTaskStatus(taskId);
        }
        
        // Close the connection as we're done
        eventSource.close();
        eventSourceRef.current = null;
      } catch (error) {
        console.error('Error handling SSE error event:', error);
      }
    });

    return eventSource;
  };

  // Fallback polling mechanism when SSE fails
  const pollTaskStatus = async (taskId: string, maxAttempts = 60, delay = 5000) => {
    // Don't start polling if we already have a model URL
    if (modelUrlRef.current) return;
    
    let attempts = 0;
    
    const checkInterval = setInterval(async () => {
      // If we already have a model URL or we're checking a different task, stop polling
      if (
        attempts >= maxAttempts || 
        modelUrlRef.current !== null || 
        taskId !== currentTaskRef.current
      ) {
        clearInterval(checkInterval);
        return;
      }
      
      attempts++;
      try {
        const statusResponse = await fetch(`${SUPABASE_URL}/functions/v1/check-3d-status?taskId=${taskId}`, {
          headers: {
            "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          }
        });
        
        if (!statusResponse.ok) {
          console.error(`Error checking status (attempt ${attempts}):`, statusResponse.status);
          return;
        }
        
        const statusData = await statusResponse.json();
        console.log(`Status check (attempt ${attempts}):`, statusData);
        
        // Update progress
        if (statusData.progress !== undefined) {
          setConversionProgress(statusData.progress);
        }
        
        // Check if completed
        if (statusData.modelUrl) {
          clearInterval(checkInterval);
          
          setModelUrl(statusData.modelUrl);
          setConversionError(null); // Clear any errors since we got a valid URL
          
          toast({
            title: "3D model created",
            description: "Your figurine is ready to view in 3D",
          });
          
          // Update figurine with model URL if we have one
          if (currentFigurineId) {
            await updateFigurineWithModelUrl(currentFigurineId, statusData.modelUrl);
          }
          
          setIsConverting(false);
        } else if (statusData.error && !modelUrlRef.current) {
          clearInterval(checkInterval);
          setConversionError(statusData.error);
          setIsConverting(false);
          
          toast({
            title: "Conversion failed",
            description: statusData.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`Error checking status (attempt ${attempts}):`, error);
      }
    }, delay);
    
    // Clean up the interval on unmount
    return () => clearInterval(checkInterval);
  };

  // Generate image using a single generation attempt strategy
  const handleGenerate = async (prompt: string, style: string, apiKey: string = "", preGeneratedImageUrl?: string) => {
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey") || apiKey;
    
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setModelUrl(null);
    setCurrentFigurineId(null);
    setGenerationMethod(null);
    setConversionProgress(0);
    setConversionError(null);
    
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

  // Convert image to 3D model using Meshy.ai API with webhook and SSE
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
    setConversionProgress(0);
    setConversionError(null);
    setModelUrl(null);
    modelUrlRef.current = null;
    
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
      
      // Use the correct Supabase URL for the edge function
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/convert-to-3d`;
      
      console.log("Edge function URL:", edgeFunctionUrl);
      
      // Call our Supabase Edge Function to convert the image to 3D
      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to convert image to 3D model";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          console.error("Error response from edge function:", errorData);
        } catch (e) {
          // If we can't parse the error as JSON, use the status text
          errorMessage = `Error: ${response.status} ${response.statusText}`;
          console.error("Error response from edge function (not JSON):", response.status, response.statusText);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.taskId) {
        throw new Error("No task ID returned from conversion service");
      }
      
      console.log("Conversion task started with ID:", data.taskId);
      toast({
        title: "3D conversion started",
        description: "Your 3D model is being created. You'll see real-time updates.",
      });
      
      // Set up SSE connection for real-time updates
      setupSSEConnection(data.taskId);
      
      // Start checking status periodically as a backup to SSE
      pollTaskStatus(data.taskId);
      
    } catch (error) {
      console.error("Conversion error:", error);
      setConversionError(error instanceof Error ? error.message : "Unknown error");
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
    generationMethod,
    conversionProgress,
    conversionError
  };
};
