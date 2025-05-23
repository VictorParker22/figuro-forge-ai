
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
    abortController.abort();
  }
  
  // Dispose the model
  if (model) {
    disposeModel(model);
  }
  
  // Revoke object URL if we created one
  if (objectUrl) {
    try {
      URL.revokeObjectURL(objectUrl);
      console.log("Revoked object URL:", objectUrl);
    } catch (error) {
      console.error("Error revoking object URL:", error);
    }
  }
};
