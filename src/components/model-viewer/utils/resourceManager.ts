
import * as THREE from "three";

// Maximum number of WebGL contexts that browsers typically support
const MAX_WEBGL_CONTEXTS = 16;

/**
 * Simple tracker for WebGL contexts to help prevent creating too many
 */
export const webGLContextTracker = {
  activeContexts: 0,
  
  // Register a new context
  registerContext() {
    this.activeContexts += 1;
    console.log(`[WebGLContextTracker] Registered context, total: ${this.activeContexts}`);
  },
  
  // Release a context
  releaseContext() {
    this.activeContexts = Math.max(0, this.activeContexts - 1);
    console.log(`[WebGLContextTracker] Released context, remaining: ${this.activeContexts}`);
  },
  
  // Check if we're nearing the limit of WebGL contexts
  isNearingLimit() {
    return this.activeContexts >= MAX_WEBGL_CONTEXTS * 0.75; // Warning at 75% of max
  }
};

/**
 * Recursively dispose of Three.js resources to prevent memory leaks
 * @param object The object to dispose
 * @returns void
 */
export const disposeObject = (object: THREE.Object3D): void => {
  if (!object) return;
  
  // Traverse the children
  object.traverse((child: THREE.Object3D) => {
    // Handle meshes
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      
      // Dispose geometry
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      
      // Dispose material(s)
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => {
            disposeMaterial(material);
          });
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });
  
  // Remove from parent if it exists
  if (object.parent) {
    object.parent.remove(object);
  }
  
  console.log("[resourceManager] Disposed of object and its resources");
};

/**
 * Dispose of a Three.js material and its textures
 * @param material The material to dispose
 */
export const disposeMaterial = (material: THREE.Material): void => {
  if (!material) return;
  
  // Dispose textures
  for (const key in material) {
    const value = (material as any)[key];
    if (value && value.isTexture) {
      value.dispose();
    }
  }
  
  // Dispose material
  material.dispose();
};

/**
 * Clean up all resources associated with a model
 * @param model The model to clean up
 * @param objectUrl Optional object URL to revoke
 * @param controller Optional abort controller to abort
 */
export const cleanupResources = (
  model: THREE.Group | null,
  objectUrl?: string | null,
  controller?: AbortController | null
): void => {
  // Abort any in-progress operations
  if (controller) {
    controller.abort();
    console.log("[resourceManager] Aborted in-progress operations");
  }
  
  // Revoke object URL if it exists
  if (objectUrl && objectUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(objectUrl);
      console.log("[resourceManager] Revoked object URL:", objectUrl);
    } catch (error) {
      console.error("[resourceManager] Error revoking object URL:", error);
    }
  }
  
  // Dispose object if it exists
  if (model) {
    disposeObject(model);
  }
};
