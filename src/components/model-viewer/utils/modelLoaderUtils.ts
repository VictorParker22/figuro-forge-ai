
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
    
    loader.load(
      url,
      (gltf) => {
        if (options?.signal?.aborted) {
          console.log("Load operation was aborted");
          reject(new Error("Load operation aborted"));
          return;
        }
        console.log("Model loaded successfully from:", url);
        resolve(gltf.scene);
      },
      (progress) => {
        if (!options?.signal?.aborted) {
          console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
          options?.onProgress?.(progress);
        }
      },
      (error) => {
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
    // Try direct loading first
    return await loadModelFromUrl(modelUrl, options);
  } catch (directError) {
    if (options?.signal?.aborted) throw directError;
    
    // If it's a string URL and not a blob URL, try with CORS proxy
    if (typeof modelUrl === 'string' && !modelUrl.startsWith('blob:')) {
      try {
        const proxyUrl = `https://cors-proxy.fringe.zone/${encodeURIComponent(modelUrl)}`;
        console.log("Trying with CORS proxy:", proxyUrl);
        
        return await loadModelFromUrl(proxyUrl, options);
      } catch (proxyError) {
        if (options?.signal?.aborted) throw proxyError;
        console.error("All loading attempts failed");
        throw proxyError || directError;
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
