
/**
 * Manager class to limit concurrent 3D model loading
 */
class ModelQueueManager {
  private static instance: ModelQueueManager;
  private loadingCount = 0;
  private maxConcurrent = 2; // Maximum number of models loading at once
  private queue: Array<() => Promise<void>> = [];
  private activeLoaders = new Set<string>();

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
   * Queue a model to be loaded
   */
  public async queueModelLoad<T>(
    modelId: string,
    loadFunction: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // If already loading this model, reject
      if (this.activeLoaders.has(modelId)) {
        reject(new Error("Model is already being loaded"));
        return;
      }

      const executeLoad = async () => {
        if (this.loadingCount >= this.maxConcurrent) {
          // Queue for later if too many concurrent loads
          this.queue.push(executeLoad);
          return;
        }

        try {
          this.loadingCount++;
          this.activeLoaders.add(modelId);
          console.log(`[Queue] Loading model: ${modelId}, Active: ${this.loadingCount}/${this.maxConcurrent}`);
          
          const result = await loadFunction();
          resolve(result);
          return result;
        } catch (error) {
          console.error(`[Queue] Error loading model ${modelId}:`, error);
          reject(error);
        } finally {
          this.loadingCount--;
          this.activeLoaders.delete(modelId);
          this.processQueue();
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
    if (this.queue.length > 0 && this.loadingCount < this.maxConcurrent) {
      console.log(`[Queue] Processing next in queue, remaining: ${this.queue.length}`);
      const nextLoad = this.queue.shift();
      nextLoad?.();
    }
  }

  /**
   * Clear the queue and reset loading state
   */
  public reset(): void {
    this.queue = [];
    this.loadingCount = 0;
    this.activeLoaders.clear();
  }
}

export const modelQueueManager = ModelQueueManager.getInstance();
