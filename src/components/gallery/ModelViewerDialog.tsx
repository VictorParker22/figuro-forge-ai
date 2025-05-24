import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import EnhancedModelViewer from "@/components/model-viewer/EnhancedModelViewer";
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
  modelName?: string;
  creatorName?: string;
  creatorAvatar?: string;
  createdAt?: string;
}

const ModelViewerDialog: React.FC<ModelViewerDialogProps> = ({
  open,
  onOpenChange,
  modelUrl,
  onClose,
  modelName = "3D Model",
  creatorName,
  creatorAvatar,
  createdAt
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
  const displayModelName = modelName || (stableModelUrl ? 
    stableModelUrl.split('/').pop()?.split('?')[0] || '3D Model' : 
    '3D Model');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] p-0 bg-gray-900/90 border border-white/10 h-[80vh] max-h-[800px]">
        {open && stableModelUrl && (
          <EnhancedModelViewer 
            modelUrl={stableModelUrl}
            isLoading={false}
            title={displayModelName}
            creatorName={creatorName}
            creatorAvatar={creatorAvatar}
            createdAt={createdAt}
            onClose={onClose}
            isDialog={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModelViewerDialog;