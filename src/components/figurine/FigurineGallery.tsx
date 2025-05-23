
import { useState } from 'react';
import { Figurine } from '@/types/figurine';
import FigurineList from './FigurineList';
import FigurineModelDialog from './FigurineModelDialog';
import { useFigurines } from './useFigurines';

const FigurineGallery = () => {
  const { figurines, loading, error } = useFigurines();
  const [selectedFigurine, setSelectedFigurine] = useState<Figurine | null>(null);
  const [modelViewerOpen, setModelViewerOpen] = useState(false);

  const handleDownload = (figurine: Figurine) => {
    const imageUrl = figurine.saved_image_url || figurine.image_url;
    if (!imageUrl) return;
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `figurine-${figurine.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewModel = (figurine: Figurine) => {
    setSelectedFigurine(figurine);
    setModelViewerOpen(true);
  };

  return (
    <>
      <FigurineList
        figurines={figurines}
        loading={loading}
        error={error}
        onDownload={handleDownload}
        onViewModel={handleViewModel}
      />

      <FigurineModelDialog 
        open={modelViewerOpen} 
        onOpenChange={setModelViewerOpen}
        selectedFigurine={selectedFigurine}
      />
    </>
  );
};

export default FigurineGallery;
