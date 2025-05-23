
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ModelViewer from '@/components/model-viewer';
import { Figurine } from '@/types/figurine';

interface FigurineModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFigurine: Figurine | null;
}

const FigurineModelDialog = ({ 
  open, 
  onOpenChange, 
  selectedFigurine 
}: FigurineModelDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 bg-transparent border-none shadow-none">
        {selectedFigurine?.model_url && (
          <ModelViewer 
            modelUrl={selectedFigurine.model_url} 
            isLoading={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FigurineModelDialog;
