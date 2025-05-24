import * as THREE from "three";
import { CACHE_PARAMS } from "../config/modelViewerConfig";

/**
 * Dispose of a Three.js 3D model and free up memory
 */
export const disposeModel = (model: THREE.Group | null): void => {
  if (!model) return;
  
  console.log("Disposing 3D model resources");
  
  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      
      // Dispose geometry
      if (mesh.geometry) {
        console.log("Disposing geometry");
        mesh.geometry.dispose();
      }
      
      // Dispose materials
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => {
            disposeMaterial(material);
          });
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });
  
  // Remove all children to ensure proper cleanup
  while (model.children.length > 0) {
    const child = model.children[0];
    model.remove(child);
  }
};

/**
 * Thoroughly dispose of a material and its textures
 */
export const disposeMaterial = (material: THREE.Material): void => {
  console.log("Disposing material");
  
  // Dispose any textures
  Object.keys(material).forEach(propertyName => {
    const value = (material as any)[propertyName];
    if (value instanceof THREE.Texture) {
      console.log(`Disposing texture: ${propertyName}`);
      value.dispose();
    }
  });
  
  // Dispose the material itself
  material.dispose();
};

/**
 * Create or revoke an object URL for a blob
 */
export const handleObjectUrl = (
  blob: Blob | null, 
  existingUrl: string | null
): string | null => {
  // Revoke existing URL if present
  if (existingUrl) {
    try {
      URL.revokeObjectURL(existingUrl);
      console.log("Revoked object URL:", existingUrl);
    } catch (error) {
      console.error("Error revoking object URL:", error);
    }
  }
  
  // Create new URL if blob is present
  if (blob) {
    const url = URL.createObjectURL(blob);
    console.log("Created new object URL:", url);
    return url;
  }
  
  return null;
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

/**
 * Compare two URLs ignoring cache parameters
 */
export const areUrlsEqual = (url1: string | null, url2: string | null): boolean => {
  if (url1 === url2) return true;
  if (!url1 || !url2) return false;
  
  try {
    return cleanUrl(url1) === cleanUrl(url2);
  } catch (e) {
    return url1 === url2;
  }
};