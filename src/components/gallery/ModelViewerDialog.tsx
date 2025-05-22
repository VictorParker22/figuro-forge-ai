
import React from "react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 bg-gray-900/90 border border-white/10">
        <DialogHeader className="p-4 border-b border-white/10">
          <DialogTitle className="flex justify-between items-center">
            <span>3D Model Viewer</span>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X size={16} />
              </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        {modelUrl && (
          <ModelViewer 
            modelUrl={modelUrl}
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
