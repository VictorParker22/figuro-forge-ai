
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { modelQueueManager } from "../utils/modelQueueManager";
import { loadModelWithFallback } from "../utils/modelLoaderUtils";
import { cleanupResources } from "../utils/resourceManager";
import { useToast } from "@/hooks/use-toast";

interface UseOptimizedModelLoaderOptions {
  modelSource: string | null;
  modelBlob?: Blob | null;
  onError?: (error: any) => void;
  priority?: number; // Higher number = higher priority
  visible?: boolean; // Whether the model is currently visible
  modelId?: string; // Optional stable ID for the model
}

/**
 * Custom hook for optimized model loading with queue management and visibility optimization
 */
export const useOptimizedModelLoader = ({
  modelSource,
  modelBlob,
  onError,
  priority = 0,
  visible = true,
  modelId: providedModelId
}: UseOptimizedModelLoaderOptions) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSourceRef = useRef<string | null | Blob>(null);
  const { toast } = useToast();

  // Generate a stable ID for this model that won't change between renders
  const modelIdRef = useRef<string>(
    providedModelId || `model-${(modelSource || '').split('/').pop()?.replace(/\.\w+$/, '')}-${Math.random().toString(36).substring(2, 7)}`
  );

  // Cleanup function to handle resource disposal properly
  const cleanupActiveResources = () => {
    if (activeSourceRef.current) {
      // Only cleanup if we're actually changing sources
      cleanupResources(
        model, 
        objectUrlRef.current,
        abortControllerRef.current
      );
      
      // Abort any queued load for this model
      modelQueueManager.abortModelLoad(modelIdRef.current);
      
      setModel(null);
    }
  };

  useEffect(() => {
    // Skip loading if not visible
    if (!visible) {
      console.log(`Model ${modelIdRef.current} not visible, skipping load`);
      return;
    }

    // Skip if no model source
    if (!modelSource && !modelBlob) {
      console.log(`No source for model ${modelIdRef.current}, skipping load`);
      return;
    }
    
    // Check if source has actually changed to prevent infinite loops
    const currentSource = modelBlob || modelSource;
    if (activeSourceRef.current === currentSource && model !== null) {
      console.log(`Model ${modelIdRef.current} source unchanged, keeping existing model`);
      return;
    }
    
    // Update active source reference
    activeSourceRef.current = currentSource;
    
    // Clean up previous resources before starting new load
    cleanupActiveResources();

    let isActive = true;
    let localObjectUrl: string | null = null;
    
    // Start loading
    const loadModel = async () => {
      // Create a new abort controller for this load
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      try {
        setLoading(true);
        setError(null);
        
        // Create a URL if we have a blob
        if (modelBlob) {
          localObjectUrl = URL.createObjectURL(modelBlob);
          objectUrlRef.current = localObjectUrl;
          console.log(`Created object URL for ${modelIdRef.current}: ${localObjectUrl}`);
        }

        // Queue the model load
        const loadedModel = await modelQueueManager.queueModelLoad(
          modelIdRef.current,
          () => loadModelWithFallback(
            localObjectUrl || modelSource!, 
            { signal }
          )
        );

        if (!isActive) return;

        console.log(`Model ${modelIdRef.current} loaded successfully`);
        setModel(loadedModel);
      } catch (err) {
        if (!isActive) return;
        
        console.error(`Error loading model ${modelIdRef.current}:`, err);
        setError(err as Error);
        
        if (onError) {
          onError(err);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      isActive = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [modelSource, modelBlob, visible, onError]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupActiveResources();
      objectUrlRef.current = null;
      activeSourceRef.current = null;
    };
  }, []);

  return { 
    loading, 
    model,
    error
  };
};
