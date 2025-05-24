import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ModelViewer from "@/components/model-viewer";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";

interface ModelViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelUrl: string | null;
  onClose: () => void;
}

const ModelViewerDialog: React.FC<ModelViewerDialogProps> = ({
  open,
  onOpenChange,
  modelUrl,
  onClose
}) => {
  // Use a stable URL reference to prevent reloading when dialog reopens
  const [stableModelUrl, setStableModelUrl] = React.useState<string | null>(null);
  
  useEffect(() => {
    // Only update the URL if it changes significantly
    if (modelUrl && modelUrl !== stableModelUrl) {
      console.log('ModelViewerDialog: Setting model URL:', modelUrl);
      
      // Small delay to ensure stable updates
      const timer = setTimeout(() => {
        setStableModelUrl(modelUrl);
      }, 50);
      
      return () => clearTimeout(timer);
    }
    
    // Reset URL when dialog closes
    if (!open) {
      setStableModelUrl(null);
    }
  }, [modelUrl, open, stableModelUrl]);
  
  // Handle dialog close properly with cleanup
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose();
    }
    onOpenChange(newOpen);
  };

  // Extract model name for better UX
  const modelName = stableModelUrl ? 
    stableModelUrl.split('/').pop()?.split('?')[0] || '3D Model' : 
    '3D Model';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 bg-gray-900/90 border border-white/10">
        <DialogHeader className="p-4 border-b border-white/10">
          <DialogTitle className="flex justify-between items-center">
            <span>3D Model Viewer: {modelName}</span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X size={16} />
              </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        {open && stableModelUrl && (
          <ModelViewer 
            modelUrl={stableModelUrl}
            isLoading={false}
          />
        )}
        <DialogFooter className="p-4 border-t border-white/10">
          <p className="text-xs text-white/50">
            Note: Only one 3D model can be viewed at a time to ensure optimal performance.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelViewerDialog;