
import * as THREE from "three";

// Configure the queue
const MAX_CONCURRENT_LOADS = 2;
const QUEUE_TIMEOUT_MS = 60000; // 1 minute timeout for queued items

interface QueueItem {
  id: string;
  loadFunction: () => Promise<THREE.Group>;
  resolve: (model: THREE.Group) => void;
  reject: (error: Error) => void;
  enqueueTime: number;
}

class ModelQueueManager {
  private queue: QueueItem[] = [];
  private activeLoads: Map<string, boolean> = new Map();
  private abortRequests: Set<string> = new Set();
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  
  constructor() {
    console.log("[ModelQueueManager] Initialized");
    // Set up periodic cleanup of stale queue items
    this.startQueueMonitoring();
  }
  
  private startQueueMonitoring() {
    this.timeoutHandle = setInterval(() => {
      this.cleanupStaleQueueItems();
    }, 10000); // Check every 10 seconds
  }
  
  private cleanupStaleQueueItems() {
    const now = Date.now();
    const staleItems = this.queue.filter(item => now - item.enqueueTime > QUEUE_TIMEOUT_MS);
    
    if (staleItems.length > 0) {
      console.log(`[ModelQueueManager] Removing ${staleItems.length} stale items from queue`);
      
      staleItems.forEach(item => {
        this.abortRequests.add(item.id);
        item.reject(new Error(`Queue timeout after ${QUEUE_TIMEOUT_MS/1000} seconds`));
        
        // Remove from active loads if it was somehow active
        if (this.activeLoads.has(item.id)) {
          this.activeLoads.delete(item.id);
        }
      });
      
      // Filter out stale items
      this.queue = this.queue.filter(item => now - item.enqueueTime <= QUEUE_TIMEOUT_MS);
      
      // Process the next items in the queue
      this.processNextInQueue();
    }
  }
  
  public queueModelLoad(
    id: string,
    loadFunction: () => Promise<THREE.Group>
  ): Promise<THREE.Group> {
    console.log(`[ModelQueueManager] Queueing model load for ${id}`);
    
    // Check if already aborted
    if (this.abortRequests.has(id)) {
      console.log(`[ModelQueueManager] Load was already aborted for ${id}`);
      return Promise.reject(new Error("Load operation aborted"));
    }
    
    // Check if already loading this model
    if (this.activeLoads.has(id)) {
      console.log(`[ModelQueueManager] Already loading model ${id}`);
    }
    
    return new Promise<THREE.Group>((resolve, reject) => {
      // Create queue item
      const queueItem: QueueItem = {
        id,
        loadFunction,
        resolve,
        reject,
        enqueueTime: Date.now()
      };
      
      // If under concurrent limit, process immediately
      if (this.activeLoads.size < MAX_CONCURRENT_LOADS) {
        this.processLoadItem(queueItem);
      } else {
        // Queue the load
        this.queue.push(queueItem);
        console.log(`[ModelQueueManager] Model ${id} queued, current queue length: ${this.queue.length}`);
      }
    });
  }
  
  private processLoadItem(item: QueueItem) {
    // Mark as active
    this.activeLoads.set(item.id, true);
    console.log(`[ModelQueueManager] Processing model ${item.id}, active loads: ${this.activeLoads.size}`);
    
    // Execute load function
    item.loadFunction()
      .then(model => {
        // Check if aborted
        if (this.abortRequests.has(item.id)) {
          console.log(`[ModelQueueManager] Load completed but was aborted for ${item.id}`);
          this.abortRequests.delete(item.id);
          item.reject(new Error("Load operation aborted"));
          return;
        }
        
        // Success
        console.log(`[ModelQueueManager] Model ${item.id} loaded successfully`);
        this.activeLoads.delete(item.id);
        item.resolve(model);
        this.processNextInQueue();
      })
      .catch(error => {
        console.error(`[ModelQueueManager] Error loading model ${item.id}:`, error);
        this.activeLoads.delete(item.id);
        item.reject(error);
        this.processNextInQueue();
      });
  }
  
  private processNextInQueue() {
    // If we have capacity and queued items, process the next one
    if (this.activeLoads.size < MAX_CONCURRENT_LOADS && this.queue.length > 0) {
      const nextItem = this.queue.shift()!;
      
      // Check if this item should be aborted
      if (this.abortRequests.has(nextItem.id)) {
        console.log(`[ModelQueueManager] Skipping aborted item ${nextItem.id}`);
        this.abortRequests.delete(nextItem.id);
        nextItem.reject(new Error("Load operation aborted"));
        this.processNextInQueue(); // Process the next item
      } else {
        console.log(`[ModelQueueManager] Processing next queued model ${nextItem.id}`);
        this.processLoadItem(nextItem);
      }
    }
  }
  
  public abortModelLoad(id: string) {
    console.log(`[ModelQueueManager] Aborting model load for ${id}`);
    this.abortRequests.add(id);
    
    // Remove from queue if it's there
    const index = this.queue.findIndex(item => item.id === id);
    if (index >= 0) {
      const item = this.queue[index];
      this.queue.splice(index, 1);
      item.reject(new Error("Load operation aborted"));
      console.log(`[ModelQueueManager] Removed model ${id} from queue`);
    }
    
    // Note: if the model is actively loading, it will be rejected in processLoadItem
  }
  
  // Cleanup on shutdown
  public destroy() {
    if (this.timeoutHandle) {
      clearInterval(this.timeoutHandle);
    }
    
    // Reject all pending loads
    this.queue.forEach(item => {
      item.reject(new Error("Queue manager destroyed"));
    });
    
    this.queue = [];
    this.activeLoads.clear();
    this.abortRequests.clear();
  }
}

// Create a singleton instance
export const modelQueueManager = new ModelQueueManager();
