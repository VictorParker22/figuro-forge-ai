import React from "react";
import EnhancedModelViewer from "./EnhancedModelViewer";

interface ModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
  progress?: number;
  errorMessage?: string | null;
  onCustomModelLoad?: (url: string, file: File) => void;
  title?: string;
  tags?: string[];
  creatorName?: string;
  creatorAvatar?: string;
  createdAt?: string;
}

// This is now just a wrapper around the enhanced model viewer
const ModelViewer: React.FC<ModelViewerProps> = (props) => {
  return <EnhancedModelViewer {...props} />;
};

export default ModelViewer;