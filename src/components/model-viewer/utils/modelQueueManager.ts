
/**
 * Manager class to limit concurrent 3D model loading
 */
class ModelQueueManager {
  private static instance: ModelQueueManager;
  private loadingCount = 0;
  private maxConcurrent = 1; // Reduced from 2 to 1 to prevent loading too many models at once
  private queue: Array<() => Promise<unknown>> = [];
  private activeLoaders = new Set<string>();
  private abortControllers = new Map<string, AbortController>();
  private processingQueue = false;

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
    this.maxConcurrent = max;
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
        this.abortControllers.get(modelId)?.abort();
        this.abortControllers.delete(modelId);
        this.activeLoaders.delete(modelId);
        
        // Reduce loading count if this was an active loader
        if (this.loadingCount > 0) {
          this.loadingCount--;
        }
        
        // Process queue in case there are pending items
        setTimeout(() => this.processQueue(), 100);
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
    loadFunction: () => Promise<T>
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
          this.queue.push(executeLoad);
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
          resolve(result);
          return result;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.log(`[Queue] Loading of model ${modelId} was aborted`);
            reject(error);
          } else {
            console.error(`[Queue] Error loading model ${modelId}:`, error);
            reject(error);
          }
        } finally {
          this.loadingCount--;
          this.activeLoaders.delete(modelId);
          this.abortControllers.delete(modelId);
          
          // Add a small delay before processing the next item to avoid thrashing
          setTimeout(() => this.processQueue(), 150);
        }
      };

      // Start loading or queue
      if (this.loadingCount < this.maxConcurrent) {
        executeLoad();
      } else {
        console.log(`[Queue] Queuing model: ${modelId}, Queue length: ${this.queue.length + 1}`);
        this.queue.push(executeLoad);
      }
    });
  }

  /**
   * Process the next item in the queue
   */
  private processQueue(): void {
    if (this.processingQueue) return;
    this.processingQueue = true;
    
    try {
      if (this.queue.length > 0 && this.loadingCount < this.maxConcurrent) {
        console.log(`[Queue] Processing next in queue, remaining: ${this.queue.length}`);
        const nextLoad = this.queue.shift();
        if (nextLoad) {
          setTimeout(() => {
            nextLoad();
          }, 200); // Increased delay to prevent race conditions
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
        console.log(`[Queue] Aborting model load during reset: ${modelId}`);
        controller.abort();
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
