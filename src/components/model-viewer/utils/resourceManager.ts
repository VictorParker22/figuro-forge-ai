import * as THREE from "three";
import { disposeModel } from "./modelUtils";
import { CLEANUP_DELAY } from "../config/modelViewerConfig";

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
  if (abortController && !abortController.signal.aborted) {
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
  private disposalTimeouts: number[] = [];
  
  private constructor() {}
  
  public static getInstance(): WebGLContextTracker {
    if (!WebGLContextTracker.instance) {
      WebGLContextTracker.instance = new WebGLContextTracker();
    }
    return WebGLContextTracker.instance;
  }
  
  public registerContext(): number {
    // Clear any pending disposal timeouts
    this.clearDisposalTimeouts();
    
    this.contextCount++;
    console.log(`WebGL context created. Active contexts: ${this.contextCount}/${this.MAX_CONTEXTS}`);
    return this.contextCount;
  }
  
  public releaseContext(): number {
    // Use a timeout to help with disposal
    const timeoutId = window.setTimeout(() => {
      if (this.contextCount > 0) {
        this.contextCount--;
      }
      console.log(`WebGL context released. Active contexts: ${this.contextCount}/${this.MAX_CONTEXTS}`);
      
      // Remove this timeout from the array
      this.disposalTimeouts = this.disposalTimeouts.filter(id => id !== timeoutId);
    }, CLEANUP_DELAY) as unknown as number;
    
    this.disposalTimeouts.push(timeoutId);
    
    return this.contextCount;
  }
  
  private clearDisposalTimeouts(): void {
    this.disposalTimeouts.forEach(id => window.clearTimeout(id));
    this.disposalTimeouts = [];
  }
  
  public isNearingLimit(): boolean {
    return this.contextCount > (this.MAX_CONTEXTS * 0.7); // 70% of max
  }
  
  public getActiveContextCount(): number {
    return this.contextCount;
  }
  
  public reset(): void {
    this.clearDisposalTimeouts();
    this.contextCount = 0;
    console.log("WebGL context tracker reset");
  }
}

export const webGLContextTracker = WebGLContextTracker.getInstance();