
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const useModelViewerState = (
  initialModelUrl: string | null,
  onCustomModelLoad?: (url: string, file: File) => void
) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLoadAttempted, setModelLoadAttempted] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [customModelBlob, setCustomModelBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const originalUrlRef = useRef<string | null>(initialModelUrl);

  // Reset error state when modelUrl changes
  useEffect(() => {
    if (initialModelUrl) {
      setModelError(null);
      setModelLoadAttempted(false);
      originalUrlRef.current = initialModelUrl;
      // Reset custom model when a new model is provided
      setCustomModelUrl(null);
      setCustomModelBlob(null);
      setCustomFile(null);
    }
  }, [initialModelUrl]);

  const triggerFileInputClick = () => {
    fileInputRef.current?.click();
  };

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
    setCustomModelBlob(file);
    
    // Create a temporary URL for download functionality
    const objectUrl = URL.createObjectURL(file);
    console.log("Created temporary URL for download:", objectUrl);
    setCustomModelUrl(objectUrl);
    setModelError(null);
    setModelLoadAttempted(false);
    
    toast({
      title: "Custom model loaded",
      description: `${file.name} has been loaded successfully`,
    });
    
    // Call the callback if provided
    if (onCustomModelLoad) {
      onCustomModelLoad(objectUrl, file);
    }
  };

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

  // Determine which URL to use for the 3D model - custom uploaded model takes priority
  const displayModelUrl = customModelUrl || initialModelUrl;
  const shouldShowError = (customModelUrl === null && initialModelUrl === null) || 
    (modelLoadAttempted && modelError);

  return {
    autoRotate,
    setAutoRotate,
    modelError,
    customFile,
    customModelUrl,
    customModelBlob,
    fileInputRef,
    displayModelUrl,
    shouldShowError,
    handleFileChange,
    triggerFileInputClick,
    handleDownload,
    handleModelError,
    modelLoadAttempted
  };
};
