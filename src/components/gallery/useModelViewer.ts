import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Maximum number of model viewers that can be open at once
const MAX_ACTIVE_VIEWERS = 1;

export const useModelViewer = () => {
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [modelViewerOpen, setModelViewerOpen] = useState(false);
  const { toast } = useToast();
  
  // Keep track of active model viewers to limit resource usage
  const activeViewersRef = useRef<number>(0);

  // Clean up WebGL context when component unmounts or when model viewers are closed
  useEffect(() => {
    return () => {
      // Reset active viewers count when component unmounts
      activeViewersRef.current = 0;
    };
  }, []);

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
    
    setViewingModel(modelUrl);
    setModelViewerOpen(true);
    activeViewersRef.current += 1;
  };
  
  const handleCloseModelViewer = () => {
    setModelViewerOpen(false);
    activeViewersRef.current = Math.max(0, activeViewersRef.current - 1);
  };
  
  return {
    viewingModel,
    modelViewerOpen,
    setModelViewerOpen,
    handleViewModel,
    handleCloseModelViewer
  };
};
