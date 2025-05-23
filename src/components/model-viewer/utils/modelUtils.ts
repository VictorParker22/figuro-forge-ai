
import * as THREE from "three";

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
            console.log("Disposing material (array)");
            material.dispose();
          });
        } else {
          console.log("Disposing material");
          mesh.material.dispose();
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
