
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { modelQueueManager } from "../model-viewer/utils/modelQueueManager";
import { webGLContextTracker } from "../model-viewer/utils/resourceManager";

// Maximum number of model viewers that can be open at once - reduced for stability
const MAX_ACTIVE_VIEWERS = 1;

export const useModelViewer = () => {
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [modelViewerOpen, setModelViewerOpen] = useState(false);
  const { toast } = useToast();
  
  // Keep track of active model viewers to limit resource usage
  const activeViewersRef = useRef<number>(0);

  // Configure the queue manager when component mounts
  useEffect(() => {
    // Set concurrent loading limit to 1 to prevent WebGL context exhaustion
    modelQueueManager.setMaxConcurrent(1);
    
    return () => {
      // Reset active viewers count when component unmounts
      if (activeViewersRef.current > 0) {
        console.log("Cleaning up model viewer resources on unmount");
        activeViewersRef.current = 0;
        
        // Reset queue manager to clean up resources
        modelQueueManager.reset();
        webGLContextTracker.reset();
      }
    };
  }, []);

  // Handle closing model viewer and cleaning up resources
  const handleCloseModelViewer = () => {
    setModelViewerOpen(false);
    setViewingModel(null); // Clear the model URL to prevent reloading
    
    activeViewersRef.current = Math.max(0, activeViewersRef.current - 1);
    webGLContextTracker.releaseContext();
    
    // Allow a more generous timeout for cleanup before allowing another open
    setTimeout(() => {
      console.log("Model viewer resources released");
    }, 800); // Increased from 500 to 800ms
  };

  // Clean URLs from cache-busting parameters
  const cleanModelUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      // Remove cache-busting parameters
      ['t', 'cb', 'cache'].forEach(param => {
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

  // Handle opening full model viewer
  const handleViewModel = (modelUrl: string) => {
    // Check if we're already at the maximum number of active viewers
    if (activeViewersRef.current >= MAX_ACTIVE_VIEWERS) {
      toast({
        title: "Viewer already open",
        description: "Please close the current model viewer before opening another one.",
        variant: "default",
      });
      return;
    }
    
    // Check if we're nearing WebGL context limits
    if (webGLContextTracker.isNearingLimit()) {
      toast({
        title: "Resource limit warning",
        description: "Browser is nearing WebGL context limit. Performance may be affected.",
        variant: "default",
      });
    }
    
    // Clean the URL to prevent reloading and resource issues
    const cleanedUrl = cleanModelUrl(modelUrl);
    
    // First close any existing viewer to clean up resources
    if (modelViewerOpen) {
      handleCloseModelViewer();
      
      // Increased timeout to ensure cleanup before opening new model
      setTimeout(() => {
        setViewingModel(cleanedUrl);
        setModelViewerOpen(true);
        activeViewersRef.current += 1;
        webGLContextTracker.registerContext();
      }, 800);
    } else {
      setViewingModel(cleanedUrl);
      setModelViewerOpen(true);
      activeViewersRef.current += 1;
      webGLContextTracker.registerContext();
    }
  };
  
  return {
    viewingModel,
    modelViewerOpen,
    setModelViewerOpen,
    handleViewModel,
    handleCloseModelViewer
  };
};
