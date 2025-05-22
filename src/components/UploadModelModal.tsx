
import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadModelModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onModelUpload: (url: string, file: File) => void;
}

const UploadModelModal = ({ isOpen, onOpenChange, onModelUpload }: UploadModelModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files[0]);
    }
  };

  // Process the selected file
  const handleFiles = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.glb')) {
      toast({
        title: "Invalid file format",
        description: "Please select a GLB file",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 100MB",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    console.log("File selected:", file.name, "size:", (file.size / 1024 / 1024).toFixed(2), "MB");
    
    toast({
      title: "File selected",
      description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    });
  };

  // Upload the model
  const handleUpload = () => {
    if (!selectedFile || isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log("Creating blob URL for file:", selectedFile.name);
      
      // Create blob URL for the file
      const objectUrl = URL.createObjectURL(selectedFile);
      console.log("Created blob URL for upload:", objectUrl);
      
      // Small timeout to ensure the blob URL is ready
      setTimeout(() => {
        onModelUpload(objectUrl, selectedFile);
        
        toast({
          title: "Model uploaded",
          description: `${selectedFile.name} has been loaded successfully`
        });
        
        // Reset selection and close modal
        setSelectedFile(null);
        setIsLoading(false);
        onOpenChange(false);
      }, 100);
    } catch (error) {
      console.error("Upload error:", error);
      setIsLoading(false);
      toast({
        title: "Upload failed",
        description: "There was an error processing your model",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isLoading) onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload 3D Model</DialogTitle>
          <DialogDescription>
            Upload your GLB 3D model file to preview and customize it
          </DialogDescription>
        </DialogHeader>
        
        <div 
          className={`mt-4 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors
            ${dragActive ? "border-figuro-accent bg-figuro-accent/10" : "border-gray-300"}
            ${selectedFile ? "border-green-500/50 bg-green-500/10" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".glb"
            className="hidden"
          />
          
          <Upload className={`w-12 h-12 mb-4 ${selectedFile ? "text-green-500" : "text-gray-400"}`} />
          
          {selectedFile ? (
            <div className="text-center">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Drag and drop your model here, or
                <button 
                  type="button"
                  onClick={handleButtonClick}
                  className="text-figuro-accent hover:text-figuro-accent-hover font-medium mx-1"
                >
                  browse
                </button>
                to upload
              </p>
              <p className="text-xs text-gray-400 mt-2">Supports GLB format only</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            className="bg-figuro-accent hover:bg-figuro-accent-hover"
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? "Processing..." : "Upload Model"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModelModal;
