
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImagePreviewProps {
  imageSrc: string | null;
  isLoading: boolean;
  onConvertTo3D: () => void;
  isConverting: boolean;
  generationMethod?: "edge" | "direct" | null;
}

const ImagePreview = ({ 
  imageSrc, 
  isLoading, 
  onConvertTo3D, 
  isConverting, 
  generationMethod 
}: ImagePreviewProps) => {
  if (!imageSrc && !isLoading) {
    return null;
  }
  
  const handleSaveImage = () => {
    if (!imageSrc) return;
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `figurine-${new Date().getTime()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-medium">Generated Image</h3>
        <div className="flex gap-2 items-center">
          {generationMethod && (
            <Badge variant="outline" className="border-white/20 text-xs">
              {generationMethod === "edge" ? "Edge Function" : "Direct API"}
            </Badge>
          )}
          {imageSrc && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/10 hover:border-white/30"
              onClick={handleSaveImage}
            >
              <Download size={16} className="mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>
      
      <div className="relative aspect-square">
        {isLoading ? (
          <div className="w-full h-full p-4">
            <Skeleton className="w-full h-full rounded-lg bg-white/5 loading-shine" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full p-4"
          >
            <img
              src={imageSrc || ''}
              alt="Generated figurine"
              className="w-full h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </div>
      
      <div className="p-4 flex justify-center">
        <Button
          className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
          onClick={onConvertTo3D}
          disabled={!imageSrc || isConverting || isLoading}
        >
          {isConverting ? "Converting..." : "Convert to 3D"}
        </Button>
      </div>
    </motion.div>
  );
};

export default ImagePreview;
