import { MAX_CONCURRENT_LOADS } from "../config/modelViewerConfig";

/**
 * Manager class to limit concurrent 3D model loading
 */
class ModelQueueManager {
  private static instance: ModelQueueManager;
  private loadingCount = 0;
  private maxConcurrent = MAX_CONCURRENT_LOADS;
  private queue: Array<{
    execute: () => Promise<unknown>,
    priority: number
  }> = [];
  private activeLoaders = new Set<string>();
  private abortControllers = new Map<string, AbortController>();
  private processingQueue = false;
  private lastProcessTime = 0; // Track when we last processed an item

  private constructor() {}

  public static getInstance(): ModelQueueManager {
    if (!ModelQueueManager.instance) {
      ModelQueueManager.instance = new ModelQueueManager();
    }
    return ModelQueueManager.instance;
  }

  /**
   * Set the maximum number of concurrent model loads
   */
  public setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, Math.min(max, 2)); // Clamp between 1 and 2
    console.log(`[Queue] Max concurrent loads set to ${this.maxConcurrent}`);
  }

  /**
   * Check if a model is currently being loaded
   */
  public isLoading(modelId: string): boolean {
    return this.activeLoaders.has(modelId);
  }

  /**
   * Abort a specific model load
   */
  public abortModelLoad(modelId: string): void {
    if (this.abortControllers.has(modelId)) {
      try {
        console.log(`[Queue] Aborting model load: ${modelId}`);
        const controller = this.abortControllers.get(modelId);
        if (controller && !controller.signal.aborted) {
          controller.abort();
        }
        this.abortControllers.delete(modelId);
        this.activeLoaders.delete(modelId);
        
        // Reduce loading count if this was an active loader
        if (this.loadingCount > 0) {
          this.loadingCount--;
        }
        
        // Process queue in case there are pending items with a delay
        setTimeout(() => this.processQueue(), 200);
      } catch (error) {
        console.error(`Error aborting model load for ${modelId}:`, error);
      }
    }
  }

  /**
   * Queue a model to be loaded
   */
  public async queueModelLoad<T>(
    modelId: string,
    loadFunction: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // If already loading this model, reject
      if (this.activeLoaders.has(modelId)) {
        reject(new Error(`Model ${modelId} is already being loaded`));
        return;
      }

      const executeLoad = async () => {
        if (this.loadingCount >= this.maxConcurrent) {
          // Queue for later if too many concurrent loads
          console.log(`[Queue] Delaying load of ${modelId}, current loads: ${this.loadingCount}/${this.maxConcurrent}`);
          this.queue.push({
            execute: executeLoad,
            priority
          });
          return;
        }

        // Create a new abort controller for this load
        const controller = new AbortController();
        this.abortControllers.set(modelId, controller);

        try {
          this.loadingCount++;
          this.activeLoaders.add(modelId);
          console.log(`[Queue] Loading model: ${modelId}, Active: ${this.loadingCount}/${this.maxConcurrent}`);
          
          const result = await loadFunction();
          
          // Check if the load was aborted before resolving
          if (controller.signal.aborted) {
            throw new DOMException('Load operation aborted', 'AbortError');
          }
          
          // Only resolve if the controller is still valid and not aborted
          if (this.abortControllers.get(modelId) === controller) {
            resolve(result);
            return result;
          } else {
            throw new DOMException('Load operation aborted', 'AbortError');
          }
        } catch (error) {
          // Only reject with non-abort errors if the controller is still valid
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.log(`[Queue] Loading of model ${modelId} was aborted`);
            reject(error);
          } else if (this.abortControllers.get(modelId) === controller) {
            console.error(`[Queue] Error loading model ${modelId}:`, error);
            reject(error);
          }
        } finally {
          // Only cleanup if this controller is still the active one
          if (this.abortControllers.get(modelId) === controller) {
            this.loadingCount--;
            this.activeLoaders.delete(modelId);
            this.abortControllers.delete(modelId);
            
            // Add a delay before processing the next item
            this.lastProcessTime = Date.now();
            setTimeout(() => this.processQueue(), 500);
          }
        }
      };

      // Start loading or queue
      if (this.loadingCount < this.maxConcurrent) {
        executeLoad();
      } else {
        console.log(`[Queue] Queuing model: ${modelId}, Queue length: ${this.queue.length + 1}`);
        this.queue.push({
          execute: executeLoad,
          priority
        });
      }
    });
  }

  /**
   * Process the next item in the queue
   */
  private processQueue(): void {
    // Prevent queue thrashing by enforcing minimum time between processes
    const now = Date.now();
    const timeSinceLastProcess = now - this.lastProcessTime;
    if (timeSinceLastProcess < 300) {
      console.log(`[Queue] Throttling queue processing - only ${timeSinceLastProcess}ms since last process`);
      setTimeout(() => this.processQueue(), 300 - timeSinceLastProcess);
      return;
    }
    
    if (this.processingQueue) return;
    this.processingQueue = true;
    
    try {
      if (this.queue.length > 0 && this.loadingCount < this.maxConcurrent) {
        // Sort queue by priority (higher priority first)
        this.queue.sort((a, b) => b.priority - a.priority);
        
        console.log(`[Queue] Processing next in queue, remaining: ${this.queue.length}`);
        const nextLoad = this.queue.shift();
        if (nextLoad) {
          this.lastProcessTime = now;
          setTimeout(() => {
            nextLoad.execute();
          }, 300); // Increased delay to prevent race conditions
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Get current queue status
   */
  public getStatus(): { loading: number, queued: number, maxConcurrent: number } {
    return {
      loading: this.loadingCount,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }

  /**
   * Clear the queue and reset loading state
   */
  public reset(): void {
    // Abort all in-progress loads
    this.abortControllers.forEach((controller, modelId) => {
      try {
        if (!controller.signal.aborted) {
          console.log(`[Queue] Aborting model load during reset: ${modelId}`);
          controller.abort();
        }
      } catch (error) {
        console.error(`Error aborting model load for ${modelId}:`, error);
      }
    });
    
    this.queue = [];
    this.loadingCount = 0;
    this.activeLoaders.clear();
    this.abortControllers.clear();
    console.log("[Queue] Queue manager reset");
  }
}

export const modelQueueManager = ModelQueueManager.getInstance();