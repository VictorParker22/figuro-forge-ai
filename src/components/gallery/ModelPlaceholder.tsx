
import React from "react";
import { Box } from "lucide-react";

interface ModelPlaceholderProps {
  fileName: string;
}

const ModelPlaceholder: React.FC<ModelPlaceholderProps> = ({ fileName }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-800/50">
      <div className="relative w-16 h-16 mb-3">
        <Box size={64} className="text-figuro-accent absolute inset-0" />
        <div className="absolute inset-0 animate-pulse bg-figuro-accent/20 rounded-md"></div>
      </div>
      <p className="text-center text-sm font-medium truncate max-w-full">
        {fileName}
      </p>
      <p className="text-white/50 text-xs mt-1">3D Model</p>
    </div>
  );
};

export default ModelPlaceholder;
