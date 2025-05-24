import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CORS_PROXIES, CACHE_PARAMS } from "../config/modelViewerConfig";

interface LoadModelOptions {
  signal?: AbortSignal;
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
    console.log("Loading model from URL:", url);
    
    // Create loader instance
    const loader = new GLTFLoader();
    
    // Add a timeout to abort if loading takes too long
    const timeoutId = setTimeout(() => {
      if (!options?.signal?.aborted) {
        const timeoutError = new Error(`Load operation timed out for ${url}`);
        console.error(timeoutError);
        reject(timeoutError);
      }
    }, 30000); // 30 second timeout
    
    loader.load(
      url,
      (gltf) => {
        clearTimeout(timeoutId);
        
        if (options?.signal?.aborted) {
          console.log("Load operation was aborted");
          reject(new DOMException("Load operation aborted", "AbortError"));
          return;
        }
        console.log("Model loaded successfully from:", url);
        resolve(gltf.scene);
      },
      (progress) => {
        if (!options?.signal?.aborted) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Loading progress: ${percent}%`);
          options?.onProgress?.(progress);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        
        if (options?.signal?.aborted) return;
        console.error("Error loading model:", error);
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
  try {
    // Clean the URL of any cache-busting parameters
    const cleanedUrl = cleanUrl(modelUrl);
    
    // Try direct loading first
    return await loadModelFromUrl(cleanedUrl, options);
  } catch (directError) {
    if (options?.signal?.aborted) throw directError;
    
    // If it's a string URL and not a blob URL, try with CORS proxy
    if (typeof modelUrl === 'string' && !modelUrl.startsWith('blob:')) {
      // Try each proxy in sequence
      for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
          const proxyUrl = `${CORS_PROXIES[i]}${encodeURIComponent(cleanUrl(modelUrl))}`;
          console.log(`Trying with CORS proxy ${i+1}/${CORS_PROXIES.length}:`, proxyUrl);
          
          return await loadModelFromUrl(proxyUrl, options);
        } catch (proxyError) {
          if (options?.signal?.aborted) throw proxyError;
          
          console.error(`Proxy ${i+1} failed:`, proxyError);
          // Continue to next proxy if available
          if (i === CORS_PROXIES.length - 1) {
            throw proxyError; // Throw the last error if all proxies fail
          }
        }
      }
      
      // This should never be reached due to the throw in the loop above
      throw directError;
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
  console.log("Created object URL from blob:", url);
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
      console.log("Revoked object URL:", url);
    } catch (error) {
      console.error("Error revoking object URL:", error);
    }
  }
};

/**
 * Clean a URL by removing cache-busting parameters
 */
export const cleanUrl = (url: string): string => {
  try {
    if (!url) return url;
    const parsedUrl = new URL(url);
    
    // Remove cache-busting parameters
    CACHE_PARAMS.forEach(param => {
      if (parsedUrl.searchParams.has(param)) {
        parsedUrl.searchParams.delete(param);
      }
    });
    
    return parsedUrl.toString();
  } catch (e) {
    // If URL parsing fails, return the original
    return url;
  }
};