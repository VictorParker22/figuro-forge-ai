
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, Box, Upload, GalleryHorizontal } from 'lucide-react';
import { Figurine } from '@/types/figurine';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface FigurineCardProps {
  figurine: Figurine;
  onDownload: (figurine: Figurine) => void;
  onViewModel: (figurine: Figurine) => void;
  onTogglePublish?: (figurine: Figurine) => void;
  onUploadModel?: (figurine: Figurine) => void;
}

const FigurineCard = ({ 
  figurine, 
  onDownload, 
  onViewModel, 
  onTogglePublish, 
  onUploadModel 
}: FigurineCardProps) => {
  const [imageError, setImageError] = React.useState(false);
  const { targetRef, isIntersecting, wasEverVisible } = useIntersectionObserver({
    rootMargin: '200px',
    threshold: 0.1,
    once: true
  });

  // Clean image URL to prevent cache-busting issues
  const cleanImageUrl = React.useMemo(() => {
    try {
      if (!figurine.saved_image_url && !figurine.image_url) return '';
      
      const url = new URL(figurine.saved_image_url || figurine.image_url);
      // Remove all cache-busting parameters
      ['t', 'cb', 'cache'].forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
        }
      });
      return url.toString();
    } catch (e) {
      // If URL parsing fails, return the original
      return figurine.saved_image_url || figurine.image_url;
    }
  }, [figurine.saved_image_url, figurine.image_url]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      ref={targetRef as React.RefObject<HTMLDivElement>}
    >
      <Card className="glass-panel overflow-hidden h-full">
        <CardHeader className="p-3 border-b border-white/10">
          <CardTitle className="text-sm font-medium truncate flex items-center justify-between">
            <span className="flex items-center">
              {figurine.title}
              {figurine.model_url && (
                <span className="ml-2 inline-flex items-center text-figuro-accent">
                  <Box size={14} />
                </span>
              )}
            </span>
            {figurine.is_public && (
              <Badge variant="secondary" className="ml-2 text-xs">Published</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full">
            <AspectRatio ratio={1} className="bg-black/20">
              {!imageError ? (
                <img 
                  src={cleanImageUrl}
                  alt={figurine.title}
                  className="w-full h-full object-cover"
                  loading="lazy" 
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 p-2">
                  <p className="text-white/60 text-xs text-center">
                    Unable to load image
                  </p>
                </div>
              )}
            </AspectRatio>
          </div>
        </CardContent>
        <CardFooter className="p-2 gap-1 flex flex-wrap justify-between">
          <span className="text-xs text-white/50 italic">
            {new Date(figurine.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent border-white/10"
              onClick={() => onDownload(figurine)}
              title="Download"
            >
              <Download size={14} />
            </Button>
            
            {onTogglePublish && (
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 bg-transparent border-white/10 ${figurine.is_public ? 'text-green-400' : ''}`}
                onClick={() => onTogglePublish(figurine)}
                title={figurine.is_public ? "Remove from Gallery" : "Publish to Gallery"}
              >
                <GalleryHorizontal size={14} />
              </Button>
            )}
            
            {onUploadModel && !figurine.model_url && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent border-white/10"
                onClick={() => onUploadModel(figurine)}
                title="Upload 3D Model"
              >
                <Upload size={14} />
              </Button>
            )}
            
            {figurine.model_url && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent border-white/10"
                onClick={() => onViewModel(figurine)}
                title="View 3D model"
              >
                <Eye size={14} />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FigurineCard;
