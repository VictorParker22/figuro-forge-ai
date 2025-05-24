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
  priority?: number;
  visible?: boolean;
  modelId?: string;
  maxRetries?: number;
}

export const useOptimizedModelLoader = ({
  modelSource,
  modelBlob,
  onError,
  priority = 0,
  visible = true,
  modelId: providedModelId,
  maxRetries = 2
}: UseOptimizedModelLoaderOptions) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSourceRef = useRef<string | null | Blob>(null);
  const retryCountRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);
  const { toast } = useToast();

  const modelIdRef = useRef<string>(
    providedModelId || `model-${(modelSource || '').split('/').pop()?.replace(/\.\w+$/, '')}-${Math.random().toString(36).substring(2, 7)}`
  );

  const cleanupActiveResources = () => {
    if (activeSourceRef.current) {
      // First abort any ongoing load
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Then cleanup resources
      cleanupResources(
        model, 
        objectUrlRef.current,
        null // Don't pass abortController since we already handled it
      );
      
      // Only abort queue if we're actually changing sources
      if (activeSourceRef.current !== modelBlob && activeSourceRef.current !== modelSource) {
        modelQueueManager.abortModelLoad(modelIdRef.current);
      }
      
      if (mountedRef.current) {
        setModel(null);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      console.log(`Model ${modelIdRef.current} not visible, skipping load`);
      return;
    }

    if (!modelSource && !modelBlob) {
      console.log(`No source for model ${modelIdRef.current}, skipping load`);
      return;
    }
    
    const currentSource = modelBlob || modelSource;
    if (activeSourceRef.current === currentSource && model !== null) {
      console.log(`Model ${modelIdRef.current} source unchanged, keeping existing model`);
      return;
    }
    
    console.log(`Loading new model source for ${modelIdRef.current}:`, currentSource);
    activeSourceRef.current = currentSource;
    retryCountRef.current = 0;
    
    cleanupActiveResources();

    const loadModel = async () => {
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      try {
        if (!mountedRef.current) return;
        setLoading(true);
        setError(null);
        
        if (modelBlob) {
          objectUrlRef.current = URL.createObjectURL(modelBlob);
          console.log(`Created object URL for ${modelIdRef.current}: ${objectUrlRef.current}`);
        }

        const loadedModel = await modelQueueManager.queueModelLoad(
          modelIdRef.current,
          () => loadModelWithFallback(
            objectUrlRef.current || modelSource!, 
            { signal }
          ),
          priority
        );

        if (!mountedRef.current) return;

        console.log(`Model ${modelIdRef.current} loaded successfully`);
        setModel(loadedModel);
        retryCountRef.current = 0;
      } catch (err) {
        if (!mountedRef.current) return;
        
        const isAbortError = err instanceof DOMException && err.name === 'AbortError';
        const isDuplicateLoad = err instanceof Error && err.message.includes('already being loaded');
        
        if (!isAbortError && !isDuplicateLoad && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retrying model load (${retryCountRef.current}/${maxRetries})`);
          
          // Exponential backoff for retries
          setTimeout(() => {
            if (mountedRef.current) {
              loadModel();
            }
          }, Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000));
          return;
        }
        
        if (!isAbortError && !isDuplicateLoad) {
          console.error(`Error loading model ${modelIdRef.current}:`, err);
          setError(err as Error);
          
          if (onError) {
            onError(err);
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [modelSource, modelBlob, visible, onError, maxRetries, priority]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
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