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

  // Clean URL to prevent cache-busting issues
  const cleanUrl = React.useMemo(() => {
    try {
      if (!file.url) return file.url;
      const url = new URL(file.url);
      ['t', 'cb', 'cache'].forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
        }
      });
      return url.toString();
    } catch (e) {
      return file.url;
    }
  }, [file.url]);

  // Load state handlers
  const handlePreviewLoaded = () => {
    setIsPreviewLoaded(true);
  };

  const handlePreviewFailed = () => {
    setPreviewFailed(true);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload(file.url, file.name);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewModel(cleanUrl);
  };

  return (
    <div className="glass-panel rounded-lg overflow-hidden group">
      <div className="aspect-square relative overflow-hidden bg-white/5">
        {file.type === 'image' ? (
          <img 
            src={cleanUrl} 
            alt={file.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full">
            {!previewFailed ? (
              <div className="w-full h-full" onLoad={handlePreviewLoaded}>
                <ModelPreview 
                  modelUrl={cleanUrl} 
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
                onClick={handleDownloadClick}
                className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
              >
                <Download size={16} className="mr-2" /> Download
              </Button>
            ) : (
              <div className="flex flex-col space-y-2 w-full">
                <Button 
                  onClick={handleViewClick}
                  className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
                >
                  <Eye size={16} className="mr-2" /> View Model
                </Button>
                <Button 
                  onClick={handleDownloadClick}
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

export default React.memo(GalleryItem, (prevProps, nextProps) => {
  // Only re-render if the file ID or URL has significantly changed
  try {
    const prevUrl = new URL(prevProps.file.url);
    const nextUrl = new URL(nextProps.file.url);
    
    // Remove cache-busting parameters
    ['t', 'cb', 'cache'].forEach(param => {
      prevUrl.searchParams.delete(param);
      nextUrl.searchParams.delete(param);
    });
    
    return prevProps.file.id === nextProps.file.id && 
           prevUrl.toString() === nextUrl.toString();
  } catch (e) {
    // If URL parsing fails, fall back to direct comparison
    return prevProps.file.id === nextProps.file.id && 
           prevProps.file.url === nextProps.file.url;
  }
});