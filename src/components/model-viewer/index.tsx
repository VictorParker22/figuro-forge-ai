import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingView from "./LoadingView";
import ErrorView from "./ErrorView";
import ModelScene from "./ModelScene";

interface ModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
  progress?: number;
  errorMessage?: string | null;
  onCustomModelLoad?: (url: string) => void;
}

const ModelViewer = ({ 
  modelUrl, 
  isLoading, 
  progress = 0, 
  errorMessage = null,
  onCustomModelLoad
}: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLoadAttempted, setModelLoadAttempted] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // Keep track of original URL for downloads
  const originalUrlRef = useRef<string | null>(modelUrl);

  // Reset error state when modelUrl changes
  useEffect(() => {
    if (modelUrl) {
      setModelError(null);
      setModelLoadAttempted(false);
      originalUrlRef.current = modelUrl;
      // Reset custom model when a new model is provided
      setCustomModelUrl(null);
      setCustomFile(null);
    }
  }, [modelUrl]);

  // Handle file upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is a GLB format
    if (!file.name.toLowerCase().endsWith('.glb')) {
      toast({
        title: "Invalid file format",
        description: "Please select a GLB file",
        variant: "destructive",
      });
      return;
    }

    console.log("Selected file:", file.name, "size:", file.size);
    setCustomFile(file);
    
    // Create blob URL for the file
    const objectUrl = URL.createObjectURL(file);
    console.log("Created blob URL:", objectUrl);
    setCustomModelUrl(objectUrl);
    setModelError(null);
    setModelLoadAttempted(false);
    
    toast({
      title: "Custom model loaded",
      description: `${file.name} has been loaded successfully`,
    });
    
    // Call the callback if provided
    if (onCustomModelLoad) {
      onCustomModelLoad(objectUrl);
    }
  };

  if (!modelUrl && !customModelUrl && !isLoading) {
    return null;
  }

  const handleDownload = () => {
    const downloadUrl = customModelUrl || originalUrlRef.current;
    if (!downloadUrl) return;
    
    try {
      // If custom file exists, download it directly
      if (customFile) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = customFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // For generated models, use the original URL for downloads, not the proxied version
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `figurine-model-${new Date().getTime()}.glb`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      toast({
        title: "Download started",
        description: "Your 3D model download has started."
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the model. Try again or check console for details.",
        variant: "destructive"
      });
    }
  };

  const handleModelError = (error: any) => {
    console.error("Error loading 3D model:", error);
    
    let errorMsg = "Failed to load 3D model. The download may still work.";
    
    // Check for specific CORS or network errors
    if (error.message) {
      if (error.message.includes("Failed to fetch")) {
        errorMsg = "Network error loading 3D model. The model URL might be restricted by CORS policy. Try the download button instead.";
      } else if (error.message.includes("Cross-Origin")) {
        errorMsg = "CORS policy prevented loading the 3D model. Try the download button instead.";
      }
    }
    
    setModelError(errorMsg);
    setModelLoadAttempted(true);
  };

  // Determine if we should show an error message
  const shouldShowError = (errorMessage || modelError) && 
    ((!modelUrl && !customModelUrl) || 
    (modelLoadAttempted && modelError));

  // Determine which URL to use for the 3D model - custom uploaded model takes priority
  const displayModelUrl = customModelUrl || modelUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-xl overflow-hidden"
      ref={containerRef}
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-medium">3D Model Preview</h3>
        <div className="flex space-x-2">
          {displayModelUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/10 hover:border-white/30"
              onClick={() => setAutoRotate(!autoRotate)}
            >
              {autoRotate ? "Stop Rotation" : "Auto Rotate"}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:border-white/30"
            onClick={handleUploadClick}
          >
            <Upload size={16} className="mr-1" />
            Upload Model
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".glb"
            className="hidden"
          />
        </div>
      </div>

      <div className="h-[400px] relative">
        {isLoading ? (
          <LoadingView progress={progress} />
        ) : shouldShowError ? (
          <ErrorView errorMessage={errorMessage || modelError} displayModelUrl={displayModelUrl} />
        ) : (
          <ModelScene 
            modelUrl={displayModelUrl} 
            autoRotate={autoRotate} 
            onModelError={handleModelError}
          />
        )}
      </div>
      
      <div className="p-4 flex justify-center">
        <Button
          className="w-full bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
          disabled={!displayModelUrl}
          onClick={handleDownload}
        >
          <Download size={16} />
          {customFile ? `Download ${customFile.name}` : "Download 3D Model"}
        </Button>
      </div>
    </motion.div>
  );
};

export default ModelViewer;
