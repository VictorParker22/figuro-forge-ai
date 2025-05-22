
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ImagePreviewProps {
  imageSrc: string | null;
  isLoading: boolean;
  onConvertTo3D: () => void;
  isConverting: boolean;
}

const ImagePreview = ({ imageSrc, isLoading, onConvertTo3D, isConverting }: ImagePreviewProps) => {
  if (!imageSrc && !isLoading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-medium">Generated Image</h3>
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
