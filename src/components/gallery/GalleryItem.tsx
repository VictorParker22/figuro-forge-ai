
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import ModelPlaceholder from "./ModelPlaceholder";
import ModelPreview from "./ModelPreview";

interface BucketImage {
  name: string;
  url: string;
  id: string;
  created_at: string;
  fullPath?: string;
  type: 'image' | '3d-model';
}

interface GalleryItemProps {
  file: BucketImage;
  onDownload: (url: string, name: string) => void;
  onViewModel: (url: string) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ file, onDownload, onViewModel }) => {
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  // Load state handlers
  const handlePreviewLoaded = () => {
    setIsPreviewLoaded(true);
  };

  const handlePreviewFailed = () => {
    setPreviewFailed(true);
  };

  return (
    <div className="glass-panel rounded-lg overflow-hidden group">
      <div className="aspect-square relative overflow-hidden bg-white/5">
        {file.type === 'image' ? (
          <img 
            src={`${file.url}?t=${Date.now()}`} 
            alt={file.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full">
            {!previewFailed ? (
              <div className="w-full h-full" onLoad={handlePreviewLoaded}>
                <ModelPreview 
                  modelUrl={file.url} 
                  fileName={file.name} 
                />
              </div>
            ) : (
              <ModelPlaceholder fileName={file.name} />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="p-4 w-full">
            {file.type === 'image' ? (
              <Button 
                onClick={() => onDownload(file.url, file.name)}
                className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
              >
                <Download size={16} className="mr-2" /> Download
              </Button>
            ) : (
              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  onClick={() => onViewModel(file.url)}
                  className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
                >
                  <Eye size={16} className="mr-2" /> View Model
                </Button>
                <Button 
                  onClick={() => onDownload(file.url, file.name)}
                  variant="outline"
                  className="w-full border-white/10"
                >
                  <Download size={16} className="mr-2" /> Download
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryItem;
