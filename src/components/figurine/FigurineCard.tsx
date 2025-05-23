
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, Box, Upload, GalleryHorizontal } from 'lucide-react';
import { Figurine } from '@/types/figurine';
import { Badge } from '@/components/ui/badge';

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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass-panel overflow-hidden">
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
          <div className="aspect-square w-full p-2">
            <img 
              src={figurine.saved_image_url || figurine.image_url} 
              alt={figurine.title}
              className="w-full h-full object-contain rounded-md"
              loading="lazy" 
            />
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
