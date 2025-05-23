
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, Box } from 'lucide-react';
import { Figurine } from '@/types/figurine';

interface FigurineCardProps {
  figurine: Figurine;
  onDownload: (figurine: Figurine) => void;
  onViewModel: (figurine: Figurine) => void;
}

const FigurineCard = ({ figurine, onDownload, onViewModel }: FigurineCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="p-3 border-b border-white/10">
          <CardTitle className="text-sm font-medium truncate">
            {figurine.title}
            {figurine.model_url && (
              <span className="ml-2 inline-flex items-center text-figuro-accent">
                <Box size={14} />
              </span>
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
        <CardFooter className="p-2 gap-2 flex justify-between">
          <span className="text-xs text-white/50 italic">
            {new Date(figurine.created_at).toLocaleDateString()}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent border-white/10"
              onClick={() => onDownload(figurine)}
              title="Download"
            >
              <Download size={14} />
            </Button>
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
