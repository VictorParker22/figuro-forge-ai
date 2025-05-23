
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
}

/**
 * Custom hook for optimized model loading with queue management and visibility optimization
 */
export const useOptimizedModelLoader = ({
  modelSource,
  modelBlob,
  onError,
  priority = 0,
  visible = true
}: UseOptimizedModelLoaderOptions) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Generate a stable ID for this model
  const modelIdRef = useRef<string>(
    `model-${(modelSource || '')}-${Date.now().toString(36)}`
  );

  useEffect(() => {
    // Skip loading if not visible
    if (!visible) {
      return;
    }

    // Skip if no model source
    if (!modelSource && !modelBlob) {
      return;
    }

    // Start loading
    let isActive = true;
    let localObjectUrl: string | null = null;

    const loadModel = async () => {
      // Clean up previous resources
      cleanupResources(
        model, 
        objectUrlRef.current,
        abortControllerRef.current
      );

      // Create a new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      try {
        setLoading(true);
        setError(null);
        
        // Create a URL if we have a blob
        if (modelBlob) {
          localObjectUrl = URL.createObjectURL(modelBlob);
          objectUrlRef.current = localObjectUrl;
          console.log(`Created object URL: ${localObjectUrl}`);
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

        console.log("Model loaded successfully");
        setModel(loadedModel);
      } catch (err) {
        if (!isActive) return;
        
        console.error("Error loading model:", err);
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
      cleanupResources(
        model, 
        objectUrlRef.current,
        abortControllerRef.current
      );

      objectUrlRef.current = null;
      setModel(null);
    };
  }, []);

  return { 
    loading, 
    model,
    error
  };
};
