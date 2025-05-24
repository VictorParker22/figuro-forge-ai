import React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import GalleryItem from "./GalleryItem";

interface BucketImage {
  name: string;
  url: string;
  id: string;
  created_at: string;
  fullPath?: string;
  type: 'image' | '3d-model';
}

interface GalleryGridProps {
  images: BucketImage[];
  isLoading: boolean;
  onDownload: (url: string, name: string) => void;
  onViewModel: (url: string) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ 
  images, 
  isLoading, 
  onDownload, 
  onViewModel 
}) => {
  // Memoize the cleaned image URLs to prevent unnecessary re-renders
  const cleanedImages = React.useMemo(() => {
    return images.map(image => {
      try {
        const url = new URL(image.url);
        ['t', 'cb', 'cache'].forEach(param => {
          if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
          }
        });
        return {
          ...image,
          url: url.toString()
        };
      } catch (e) {
        return image;
      }
    });
  }, [images]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="glass-panel">
            <div className="p-0">
              <div className="aspect-square w-full">
                <Skeleton className="h-full w-full bg-white/5 loading-shine" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cleanedImages.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/70 mb-4">No images found in the bucket yet.</p>
        <p className="text-white/50 mb-8">Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cleanedImages.map((file, index) => (
        <motion.div 
          key={file.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <GalleryItem 
            file={file} 
            onDownload={onDownload} 
            onViewModel={onViewModel} 
          />
        </motion.div>
      ))}
    </div>
  );
};

export default React.memo(GalleryGrid);