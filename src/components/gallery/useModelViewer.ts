
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { modelQueueManager } from "../model-viewer/utils/modelQueueManager";
import { webGLContextTracker } from "../model-viewer/utils/resourceManager";

// Maximum number of model viewers that can be open at once
const MAX_ACTIVE_VIEWERS = 1;

export const useModelViewer = () => {
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [modelViewerOpen, setModelViewerOpen] = useState(false);
  const { toast } = useToast();
  
  // Keep track of active model viewers to limit resource usage
  const activeViewersRef = useRef<number>(0);

  // Configure the queue manager when component mounts
  useEffect(() => {
    // Set concurrent loading limit
    modelQueueManager.setMaxConcurrent(2);
    
    return () => {
      // Reset active viewers count when component unmounts
      activeViewersRef.current = 0;
      
      // Reset queue manager to clean up resources
      modelQueueManager.reset();
    };
  }, []);

  // Handle closing model viewer and cleaning up resources
  const handleCloseModelViewer = () => {
    setModelViewerOpen(false);
    setViewingModel(null); // Clear the model URL to prevent reloading
    
    activeViewersRef.current = Math.max(0, activeViewersRef.current - 1);
    webGLContextTracker.releaseContext();
    
    // Allow a short timeout for cleanup before allowing another open
    setTimeout(() => {
      console.log("Model viewer resources released");
    }, 300);
  };

  // Handle opening full model viewer
  const handleViewModel = (modelUrl: string) => {
    // Check if we're already at the maximum number of active viewers
    if (activeViewersRef.current >= MAX_ACTIVE_VIEWERS) {
      toast({
        title: "Too many viewers open",
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
    
    // First close any existing viewer to clean up resources
    if (modelViewerOpen) {
      handleCloseModelViewer();
      
      // Short timeout to ensure cleanup before opening new model
      setTimeout(() => {
        setViewingModel(modelUrl);
        setModelViewerOpen(true);
        activeViewersRef.current += 1;
        webGLContextTracker.registerContext();
      }, 300);
    } else {
      setViewingModel(modelUrl);
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
