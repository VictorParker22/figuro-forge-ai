
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useToast } from "@/hooks/use-toast";
import { loadModelWithFallback, createObjectUrl, revokeObjectUrl } from "../utils/modelLoaderUtils";
import { cleanupResources } from "../utils/resourceManager";
import { modelQueueManager } from "../utils/modelQueueManager";

interface UseModelLoaderProps {
  modelSource: string | null;
  modelBlob?: Blob | null;
  onError: (error: any) => void;
  modelId?: string;
}

export const useModelLoader = ({ 
  modelSource, 
  modelBlob, 
  onError,
  modelId: providedModelId 
}: UseModelLoaderProps) => {
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const { toast } = useToast();
  
  // Refs to track resources and prevent memory leaks
  const isLoadingRef = useRef<boolean>(false);
  const controllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const modelIdRef = useRef<string>(
    providedModelId || `modelloader-${Math.random().toString(36).substring(2, 10)}`
  );
  
  // Add refs to track current source to prevent infinite loops
  const currentSourceRef = useRef<string | Blob | null>(null);
  const loadAttemptRef = useRef<number>(0);

  useEffect(() => {
    console.log(`useModelLoader: Effect triggered for ${modelIdRef.current}`);
    
    // Skip effect if no source provided
    if (!modelSource && !modelBlob) {
      console.log(`No model source provided for ${modelIdRef.current}, skipping load`);
      setLoading(false);
      return;
    }
    
    // Check if the same source is being loaded again to prevent infinite loops
    const newSource = modelBlob || modelSource;
    const sourceKey = modelBlob ? 'blob-source' : modelSource;
    
    if (sourceKey === currentSourceRef.current && model) {
      console.log(`Same model source detected for ${modelIdRef.current}, skipping reload`);
      return;
    }
    
    // Limit load attempts to prevent infinite loops
    if (loadAttemptRef.current > 3) {
      console.log(`Too many load attempts for ${modelIdRef.current}, aborting`);
      setLoading(false);
      onError(new Error("Too many load attempts"));
      return;
    }
    
    loadAttemptRef.current += 1;
    console.log(`Load attempt ${loadAttemptRef.current} for ${modelIdRef.current}`);
    
    // Update current source reference
    currentSourceRef.current = sourceKey;
    
    // Abort previous load if in progress
    if (controllerRef.current) {
      console.log(`Aborting previous load operation for ${modelIdRef.current}`);
      controllerRef.current.abort();
      
      // Also abort any queued load
      modelQueueManager.abortModelLoad(modelIdRef.current);
    }
    
    // Clean up previous model resources
    if (model) {
      console.log(`Cleaning up previous model resources for ${modelIdRef.current}`);
      cleanupResources(model, objectUrlRef.current, controllerRef.current);
      setModel(null);
    }
    
    // Create a new abort controller for this load operation
    controllerRef.current = new AbortController();
    
    // Set loading state
    setLoading(true);
    isLoadingRef.current = true;
    
    const loadModel = async () => {
      try {
        let modelUrl: string;
        
        // Handle different source types
        if (modelBlob) {
          // It's a Blob object, create an object URL
          if (objectUrlRef.current) {
            revokeObjectUrl(objectUrlRef.current);
            objectUrlRef.current = null;
          }
          
          objectUrlRef.current = createObjectUrl(modelBlob);
          modelUrl = objectUrlRef.current;
          console.log(`Created object URL for ${modelIdRef.current}: ${modelUrl}`);
        } else if (typeof modelSource === 'string') {
          // It's a URL string
          modelUrl = modelSource;
          console.log(`Loading from URL string for ${modelIdRef.current}: ${modelUrl}`);
        } else {
          console.log(`Invalid model source for ${modelIdRef.current}`);
          setLoading(false);
          isLoadingRef.current = false;
          return;
        }
        
        // Queue the model load
        const loadedModel = await modelQueueManager.queueModelLoad(
          modelIdRef.current,
          () => loadModelWithFallback(modelUrl, {
            signal: controllerRef.current?.signal,
            onProgress: (progress) => {
              // Optional progress tracking
              const percent = Math.round((progress.loaded / progress.total) * 100);
              if (percent % 25 === 0) { // Log only at 0%, 25%, 50%, 75%, 100%
                console.log(`Loading progress for ${modelIdRef.current}: ${percent}%`);
              }
            }
          })
        );
        
        if (controllerRef.current?.signal.aborted) {
          console.log(`Load operation was aborted for ${modelIdRef.current}`);
          return;
        }
        
        setModel(loadedModel);
        setLoading(false);
        isLoadingRef.current = false;
        loadAttemptRef.current = 0; // Reset counter on success
        console.log(`Model ${modelIdRef.current} loaded successfully`);
        
      } catch (error) {
        if (controllerRef.current?.signal.aborted) {
          console.log(`Error ignored due to abort for ${modelIdRef.current}`);
          return;
        }
        
        console.error(`Failed to load model ${modelIdRef.current}:`, error);
        onError(error);
        setLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      
      // Don't dispose the model here - let the component using it handle disposal
      // Just clean up the controller and URL
      if (objectUrlRef.current && modelBlob) {
        revokeObjectUrl(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [modelSource, modelBlob, onError, model]);
  
  // Clean up all resources when unmounting
  useEffect(() => {
    return () => {
      cleanupResources(model, objectUrlRef.current, controllerRef.current);
      console.log(`Cleaned up resources on unmount for ${modelIdRef.current}`);
    };
  }, []);
  
  return { loading, model };
};
