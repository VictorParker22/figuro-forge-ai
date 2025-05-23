
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
  const controllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const modelIdRef = useRef<string>(
    providedModelId || `modelloader-${Math.random().toString(36).substring(2, 10)}`
  );
  
  // Add refs to track current source to prevent infinite loops
  const currentSourceRef = useRef<string | Blob | null>(null);
  const loadAttemptRef = useRef<number>(0);
  const mountedRef = useRef(true);
  
  // Clean up function to handle abort and resource cleanup
  const cleanup = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    
    if (objectUrlRef.current) {
      revokeObjectUrl(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    
    // Also abort any queued loads
    if (modelIdRef.current) {
      modelQueueManager.abortModelLoad(modelIdRef.current);
    }
  };

  useEffect(() => {
    console.log(`[useModelLoader] Effect triggered for ${modelIdRef.current}`);
    mountedRef.current = true;
    
    // Cleanup on unmount
    return () => {
      console.log(`[useModelLoader] Component unmounting for ${modelIdRef.current}`);
      mountedRef.current = false;
      cleanup();
      
      // Clean up the model if it exists
      if (model) {
        cleanupResources(model);
      }
    };
  }, []);

  useEffect(() => {
    console.log(`[useModelLoader] Source change effect for ${modelIdRef.current}`);
    
    // Skip effect if no source provided
    if (!modelSource && !modelBlob) {
      console.log(`[useModelLoader] No source provided for ${modelIdRef.current}, skipping load`);
      setLoading(false);
      return;
    }
    
    // Check if the same source is being loaded again to prevent infinite loops
    const newSource = modelBlob || modelSource;
    const sourceKey = modelBlob ? 'blob-source' : modelSource;
    
    if (sourceKey === currentSourceRef.current && model) {
      console.log(`[useModelLoader] Same model source detected for ${modelIdRef.current}, skipping reload`);
      return;
    }
    
    // Limit load attempts to prevent infinite loops
    if (loadAttemptRef.current > 3) {
      console.log(`[useModelLoader] Too many load attempts for ${modelIdRef.current}, aborting`);
      setLoading(false);
      onError(new Error("Too many load attempts"));
      return;
    }
    
    loadAttemptRef.current += 1;
    console.log(`[useModelLoader] Load attempt ${loadAttemptRef.current} for ${modelIdRef.current}`);
    
    // Update current source reference
    currentSourceRef.current = sourceKey;
    
    // Abort previous load and clean up resources
    cleanup();
    
    // Clean up previous model resources
    if (model) {
      console.log(`[useModelLoader] Cleaning up previous model resources for ${modelIdRef.current}`);
      cleanupResources(model);
      setModel(null);
    }
    
    // Create a new abort controller for this load operation
    controllerRef.current = new AbortController();
    
    // Set loading state
    setLoading(true);
    
    // Process the URL if it's from Supabase storage
    let modelUrl = modelSource;
    if (modelSource && modelSource.includes('supabase.co/storage/v1/object/public')) {
      // Add cache buster to Supabase URLs
      const cacheBuster = `cb=${Date.now()}`;
      modelUrl = modelSource.includes('?') 
        ? `${modelSource}&${cacheBuster}` 
        : `${modelSource}?${cacheBuster}`;
      console.log(`[useModelLoader] Added cache buster to Supabase URL: ${modelUrl}`);
    }
    
    const loadModel = async () => {
      try {
        // Handle different source types
        if (modelBlob) {
          // It's a Blob object, create an object URL
          if (objectUrlRef.current) {
            revokeObjectUrl(objectUrlRef.current);
            objectUrlRef.current = null;
          }
          
          objectUrlRef.current = createObjectUrl(modelBlob);
          modelUrl = objectUrlRef.current;
          console.log(`[useModelLoader] Created object URL for ${modelIdRef.current}: ${modelUrl}`);
        } else if (!modelUrl) {
          console.log(`[useModelLoader] Invalid model source for ${modelIdRef.current}`);
          setLoading(false);
          return;
        }
        
        // Queue the model load with proper timeout
        console.log(`[useModelLoader] Starting to load model from ${modelUrl}`);
        const loadedModel = await modelQueueManager.queueModelLoad(
          modelIdRef.current,
          () => loadModelWithFallback(modelUrl!, {
            signal: controllerRef.current?.signal,
            timeout: 20000, // 20 second timeout
            onProgress: (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              if (percent % 20 === 0) { // Log at 0%, 20%, 40%, etc.
                console.log(`[useModelLoader] Loading progress for ${modelIdRef.current}: ${percent}%`);
              }
            }
          })
        );
        
        if (!mountedRef.current) {
          console.log(`[useModelLoader] Component unmounted during load for ${modelIdRef.current}`);
          return;
        }
        
        if (controllerRef.current?.signal.aborted) {
          console.log(`[useModelLoader] Load operation was aborted for ${modelIdRef.current}`);
          return;
        }
        
        console.log(`[useModelLoader] Model ${modelIdRef.current} loaded successfully`);
        setModel(loadedModel);
        setLoading(false);
        loadAttemptRef.current = 0; // Reset counter on success
        
      } catch (error) {
        if (!mountedRef.current) return;
        
        if (controllerRef.current?.signal.aborted) {
          console.log(`[useModelLoader] Error ignored due to abort for ${modelIdRef.current}`);
          return;
        }
        
        console.error(`[useModelLoader] Failed to load model ${modelIdRef.current}:`, error);
        onError(error);
        setLoading(false);
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      console.log(`[useModelLoader] Source effect cleanup for ${modelIdRef.current}`);
      cleanup();
    };
  }, [modelSource, modelBlob, onError]);
  
  return { loading, model };
};
