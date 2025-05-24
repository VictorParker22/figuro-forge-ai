import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, RotateCcw } from "lucide-react";

interface ModelHeaderProps {
  displayModelUrl: string | null;
  autoRotate: boolean;
  onAutoRotateToggle: () => void;
  onUploadClick: () => void;
}

const ModelHeader = ({ 
  displayModelUrl, 
  autoRotate, 
  onAutoRotateToggle, 
  onUploadClick 
}: ModelHeaderProps) => {
  return (
    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
      <h3 className="text-lg font-medium text-white">3D Model Preview</h3>
      <div className="flex space-x-2">
        {displayModelUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/10 hover:border-white/30 bg-black/30 text-white flex items-center gap-1.5"
            onClick={onAutoRotateToggle}
          >
            <RotateCcw size={14} className={autoRotate ? "animate-spin" : ""} />
            {autoRotate ? "Stop Rotation" : "Auto Rotate"}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 hover:border-white/30 bg-black/30 text-white flex items-center gap-1.5"
          onClick={onUploadClick}
        >
          <Upload size={14} />
          Upload Model
        </Button>
      </div>
    </div>
  );
};

export default ModelHeader;