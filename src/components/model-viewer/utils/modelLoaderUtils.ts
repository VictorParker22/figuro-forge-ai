
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface LoadModelOptions {
  signal?: AbortSignal;
  timeout?: number;
  onProgress?: (progress: ProgressEvent<EventTarget>) => void;
}

/**
 * Load a 3D model from a URL using GLTFLoader
 * @param url The URL of the model to load
 * @param options Loading options including abort signal and progress callback
 * @returns Promise that resolves to the loaded THREE.Group
 */
export const loadModelFromUrl = (
  url: string,
  options?: LoadModelOptions
): Promise<THREE.Group> => {
  return new Promise<THREE.Group>((resolve, reject) => {
    console.log("[loadModelFromUrl] Loading model from URL:", url);
    
    // Create loader instance
    const loader = new GLTFLoader();
    
    // Set up timeout handling
    const timeoutId = options?.timeout 
      ? setTimeout(() => {
          if (!options?.signal?.aborted) {
            const timeoutError = new Error(`Load operation timed out after ${options.timeout}ms for ${url}`);
            console.error("[loadModelFromUrl] Timeout:", timeoutError);
            reject(timeoutError);
          }
        }, options.timeout)
      : null;
    
    // Check if already aborted
    if (options?.signal?.aborted) {
      console.log("[loadModelFromUrl] Load operation was already aborted");
      if (timeoutId) clearTimeout(timeoutId);
      reject(new Error("Load operation aborted"));
      return;
    }
    
    // Set up abort signal listener
    const abortListener = () => {
      console.log("[loadModelFromUrl] Load operation aborted by signal");
      if (timeoutId) clearTimeout(timeoutId);
      reject(new Error("Load operation aborted"));
    };
    
    options?.signal?.addEventListener("abort", abortListener);
    
    // Log the URL being loaded
    const cleanUrl = url.length > 100 ? `${url.substring(0, 90)}...${url.substring(url.length - 10)}` : url;
    console.log(`[loadModelFromUrl] Attempting to load from: ${cleanUrl}`);
    
    // Start loading the model
    loader.load(
      url,
      (gltf) => {
        // Clear timeout if set
        if (timeoutId) clearTimeout(timeoutId);
        
        // Remove abort listener
        options?.signal?.removeEventListener("abort", abortListener);
        
        // Check if aborted during load
        if (options?.signal?.aborted) {
          console.log("[loadModelFromUrl] Load completed but was aborted");
          reject(new Error("Load operation aborted"));
          return;
        }
        
        console.log("[loadModelFromUrl] Model loaded successfully");
        resolve(gltf.scene);
      },
      (progress) => {
        if (options?.signal?.aborted) return;
        
        const percent = Math.round((progress.loaded / progress.total) * 100);
        if (percent % 20 === 0 || percent === 100) { // Log at 0%, 20%, 40%, etc. and 100%
          console.log(`[loadModelFromUrl] Loading progress: ${percent}%`);
        }
        options?.onProgress?.(progress);
      },
      (error) => {
        // Clear timeout if set
        if (timeoutId) clearTimeout(timeoutId);
        
        // Remove abort listener
        options?.signal?.removeEventListener("abort", abortListener);
        
        // Don't reject if aborted
        if (options?.signal?.aborted) return;
        
        console.error("[loadModelFromUrl] Error loading model:", error);
        reject(error);
      }
    );
  });
};

/**
 * Load a model directly from a Blob, bypassing the queue system
 * This is a fast path for blob URLs to avoid race conditions
 * @param blob The blob containing the model data
 * @returns Promise that resolves to the loaded THREE.Group
 */
export const loadModelFromBlob = (blob: Blob): Promise<THREE.Group> => {
  return new Promise<THREE.Group>((resolve, reject) => {
    console.log("[loadModelFromBlob] Loading model from blob directly");
    
    // Create temporary object URL
    const objectUrl = URL.createObjectURL(blob);
    
    // Create loader instance
    const loader = new GLTFLoader();
    
    // Start loading the model
    loader.load(
      objectUrl,
      (gltf) => {
        console.log("[loadModelFromBlob] Model loaded successfully");
        
        // Important: Revoke URL only after successful load
        URL.revokeObjectURL(objectUrl);
        
        resolve(gltf.scene);
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        if (percent % 20 === 0 || percent === 100) {
          console.log(`[loadModelFromBlob] Loading progress: ${percent}%`);
        }
      },
      (error) => {
        console.error("[loadModelFromBlob] Error loading model:", error);
        
        // Always revoke the URL on error
        URL.revokeObjectURL(objectUrl);
        
        reject(error);
      }
    );
  });
};

/**
 * Try to load a model with CORS proxy if direct loading fails
 * @param modelUrl Original URL to try loading from
 * @param options Loading options
 * @returns The loaded model
 */
export const loadModelWithFallback = async (
  modelUrl: string,
  options?: LoadModelOptions
): Promise<THREE.Group> => {
  // For Supabase storage URLs, try direct loading with proper headers
  if (modelUrl.includes('supabase.co/storage/v1/object/public')) {
    try {
      console.log("[loadModelWithFallback] Loading from Supabase storage URL");
      return await loadModelFromUrl(modelUrl, options);
    } catch (storageError) {
      if (options?.signal?.aborted) throw storageError;
      console.error("[loadModelWithFallback] Failed to load from Supabase storage:", storageError);
      
      // Continue to fallback methods
    }
  }
  
  try {
    // Try direct loading first
    return await loadModelFromUrl(modelUrl, options);
  } catch (directError) {
    if (options?.signal?.aborted) throw directError;
    console.error("[loadModelWithFallback] Direct loading failed:", directError);
    
    // If it's a string URL and not a blob URL, try with CORS proxy
    if (typeof modelUrl === 'string' && !modelUrl.startsWith('blob:')) {
      try {
        // Try with first CORS proxy
        const proxyUrl = `https://cors-proxy.fringe.zone/${encodeURIComponent(modelUrl)}`;
        console.log("[loadModelWithFallback] Trying with CORS proxy:", proxyUrl);
        
        return await loadModelFromUrl(proxyUrl, options);
      } catch (proxyError) {
        if (options?.signal?.aborted) throw proxyError;
        console.error("[loadModelWithFallback] First proxy loading failed:", proxyError);
        
        // Try one more fallback proxy
        try {
          const backupProxyUrl = `https://corsproxy.io/?${encodeURIComponent(modelUrl)}`;
          console.log("[loadModelWithFallback] Trying with backup CORS proxy:", backupProxyUrl);
          
          return await loadModelFromUrl(backupProxyUrl, options);
        } catch (backupProxyError) {
          console.error("[loadModelWithFallback] All loading attempts failed");
          throw backupProxyError || proxyError || directError;
        }
      }
    } else {
      // For blob URLs, just propagate the error
      throw directError;
    }
  }
};

/**
 * Create an object URL from a Blob
 * @param blob The Blob to create a URL for
 * @returns The created object URL
 */
export const createObjectUrl = (blob: Blob): string => {
  const url = URL.createObjectURL(blob);
  console.log("[createObjectUrl] Created object URL from blob:", url);
  return url;
};

/**
 * Revoke an object URL to prevent memory leaks
 * @param url The URL to revoke
 */
export const revokeObjectUrl = (url: string | null): void => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
      console.log("[revokeObjectUrl] Revoked object URL:", url);
    } catch (error) {
      console.error("[revokeObjectUrl] Error revoking object URL:", error);
    }
  }
};
