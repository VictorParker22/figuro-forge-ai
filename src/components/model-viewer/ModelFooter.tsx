
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ModelFooterProps {
  displayModelUrl: string | null;
  customFileName: string | null;
  onDownload: () => void;
}

const ModelFooter = ({ 
  displayModelUrl, 
  customFileName, 
  onDownload 
}: ModelFooterProps) => {
  return (
    <div className="p-4 flex justify-center">
      <Button
        className="w-full bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
        disabled={!displayModelUrl}
        onClick={onDownload}
      >
        <Download size={16} />
        {customFileName ? `Download ${customFileName}` : "Download 3D Model"}
      </Button>
    </div>
  );
};

export default ModelFooter;
