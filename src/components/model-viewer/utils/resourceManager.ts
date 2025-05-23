
import * as THREE from "three";
import { disposeModel } from "./modelUtils";

/**
 * Clean up resources to prevent memory leaks
 * @param model The model to clean up
 * @param objectUrl The object URL to revoke
 * @param abortController The abort controller to abort
 */
export const cleanupResources = (
  model: THREE.Group | null,
  objectUrl: string | null,
  abortController: AbortController | null
): void => {
  // Abort any in-progress loads
  if (abortController) {
    try {
      abortController.abort();
      console.log("Aborted in-progress model load");
    } catch (error) {
      console.error("Error aborting model load:", error);
    }
  }
  
  // Dispose the model
  if (model) {
    try {
      console.log("Disposing model resources");
      disposeModel(model);
    } catch (error) {
      console.error("Error disposing model:", error);
    }
  }
  
  // Revoke object URL if we created one
  if (objectUrl && objectUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(objectUrl);
      console.log("Revoked object URL:", objectUrl);
    } catch (error) {
      console.error("Error revoking object URL:", error);
    }
  }
  
  // Force garbage collection hint (not guaranteed to work)
  if (window.gc) {
    try {
      window.gc();
    } catch (e) {
      console.log("Manual GC not available");
    }
  }
};

/**
 * Track WebGL context usage across the application
 */
class WebGLContextTracker {
  private static instance: WebGLContextTracker;
  private contextCount = 0;
  private readonly MAX_CONTEXTS = 8; // Most browsers limit to 8-16 concurrent contexts
  
  private constructor() {}
  
  public static getInstance(): WebGLContextTracker {
    if (!WebGLContextTracker.instance) {
      WebGLContextTracker.instance = new WebGLContextTracker();
    }
    return WebGLContextTracker.instance;
  }
  
  public registerContext(): number {
    this.contextCount++;
    console.log(`WebGL context created. Active contexts: ${this.contextCount}/${this.MAX_CONTEXTS}`);
    return this.contextCount;
  }
  
  public releaseContext(): number {
    if (this.contextCount > 0) {
      this.contextCount--;
    }
    console.log(`WebGL context released. Active contexts: ${this.contextCount}/${this.MAX_CONTEXTS}`);
    return this.contextCount;
  }
  
  public isNearingLimit(): boolean {
    return this.contextCount > (this.MAX_CONTEXTS * 0.7); // 70% of max
  }
  
  public getActiveContextCount(): number {
    return this.contextCount;
  }
}

export const webGLContextTracker = WebGLContextTracker.getInstance();
