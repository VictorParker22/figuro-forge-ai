
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useToast } from "@/hooks/use-toast";
import { loadModelWithFallback, createObjectUrl, revokeObjectUrl } from "../utils/modelLoaderUtils";
import { cleanupResources } from "../utils/resourceManager";

interface UseModelLoaderProps {
  modelSource: string | null;
  modelBlob?: Blob | null;
  onError: (error: any) => void;
}

export const useModelLoader = ({ modelSource, modelBlob, onError }: UseModelLoaderProps) => {
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const { toast } = useToast();
  
  // Refs to track resources and prevent memory leaks
  const isLoadingRef = useRef<boolean>(false);
  const controllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  
  // Add refs to track last loaded blob/URL to prevent infinite loops
  const lastBlobRef = useRef<Blob | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("useModelLoader: Effect triggered with source:", 
      typeof modelSource === 'string' ? modelSource : 'Blob object');
    
    // Skip effect if no source provided
    if (!modelSource && !modelBlob) {
      console.log("No model source provided, skipping load");
      return;
    }
    
    // Check if the same source is being loaded again to prevent infinite loops
    const isRepeatedBlob = modelBlob && lastBlobRef.current && modelBlob === lastBlobRef.current;
    const isRepeatedUrl = modelSource && lastUrlRef.current && modelSource === lastUrlRef.current;
    
    if (isRepeatedBlob || isRepeatedUrl) {
      console.log("Same model source detected, skipping reload");
      return;
    }
    
    // Update last loaded sources
    if (modelBlob) lastBlobRef.current = modelBlob;
    if (modelSource) lastUrlRef.current = modelSource;
    
    // Create new abort controller for this load operation
    if (controllerRef.current) {
      console.log("Aborting previous load operation");
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    
    // Set loading state
    setLoading(true);
    isLoadingRef.current = true;
    
    const loadModel = async () => {
      try {
        let modelUrl: string;
        let shouldRevokeUrl = false;
        
        // Handle different source types
        if (modelBlob) {
          // It's a Blob object, create an object URL
          if (objectUrlRef.current) {
            revokeObjectUrl(objectUrlRef.current);
            objectUrlRef.current = null;
          }
          
          objectUrlRef.current = createObjectUrl(modelBlob);
          modelUrl = objectUrlRef.current;
          shouldRevokeUrl = true;
          console.log("Created and loading from blob object URL:", modelUrl);
        } else if (typeof modelSource === 'string') {
          // It's a URL string
          modelUrl = modelSource;
          console.log("Loading from URL string:", modelUrl);
        } else {
          console.log("Invalid model source");
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        
        try {
          // Load the model with fallback strategy
          const scene = await loadModelWithFallback(modelUrl, {
            signal: controllerRef.current?.signal
          });
          
          setModel(scene);
          setLoading(false);
          isLoadingRef.current = false;
          toast({
            title: "Model loaded",
            description: "3D model loaded successfully",
          });
        } catch (error) {
          if (controllerRef.current?.signal.aborted) return;
          
          console.error("Failed to load model:", error);
          onError(error);
          setLoading(false);
          isLoadingRef.current = false;
          toast({
            title: "Loading failed",
            description: "Failed to load the 3D model. Please try downloading it instead.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (controllerRef.current?.signal.aborted) return;
        console.error("Unexpected error in model loading:", error);
        onError(error);
        setLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      console.log("Cleanup: Disposing model resources");
      cleanupResources(model, objectUrlRef.current, controllerRef.current);
      isLoadingRef.current = false;
      objectUrlRef.current = null;
      controllerRef.current = null;
    };
  }, [modelSource, modelBlob, onError, toast, model]);
  
  return { loading, model };
};
