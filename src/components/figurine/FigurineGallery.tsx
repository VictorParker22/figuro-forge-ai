
import { useState } from 'react';
import { Figurine } from '@/types/figurine';
import FigurineList from './FigurineList';
import FigurineModelDialog from './FigurineModelDialog';
import { useFigurines } from './useFigurines';
import UploadModelModal from '@/components/UploadModelModal';
import { updateFigurinePublicStatus, updateFigurineWithModelUrl } from '@/services/figurineService';
import { useToast } from '@/hooks/use-toast';

const FigurineGallery = () => {
  const { figurines, loading, error, refreshFigurines } = useFigurines();
  const [selectedFigurine, setSelectedFigurine] = useState<Figurine | null>(null);
  const [modelViewerOpen, setModelViewerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (figurine: Figurine) => {
    const imageUrl = figurine.saved_image_url || figurine.image_url;
    if (!imageUrl) return;
    
    try {
      // Fetch the image data as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create an object URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger the download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `figurine-${figurine.id}.png`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error("Error downloading figurine:", error);
      toast({
        title: "Download failed",
        description: "There was a problem downloading the figurine image",
        variant: "destructive"
      });
    }
  };

  const handleViewModel = (figurine: Figurine) => {
    setSelectedFigurine(figurine);
    setModelViewerOpen(true);
  };

  const handleTogglePublish = async (figurine: Figurine) => {
    try {
      const newPublicStatus = !figurine.is_public;
      await updateFigurinePublicStatus(figurine.id, newPublicStatus);
      
      toast({
        title: newPublicStatus ? "Figurine published" : "Figurine unpublished",
        description: newPublicStatus 
          ? "Your figurine is now visible in the public gallery" 
          : "Your figurine has been removed from the public gallery"
      });
      
      // Refresh the list to get updated data
      refreshFigurines();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast({
        title: "Error",
        description: "Failed to update the figurine's publish status",
        variant: "destructive"
      });
    }
  };

  const handleUploadModel = (figurine: Figurine) => {
    setSelectedFigurine(figurine);
    setUploadModalOpen(true);
  };

  const handleModelUpload = async (url: string, file: File) => {
    if (!selectedFigurine) return;
    
    try {
      await updateFigurineWithModelUrl(selectedFigurine.id, url);
      
      toast({
        title: "3D model uploaded",
        description: "The 3D model has been added to your figurine"
      });
      
      // Refresh the list to get updated data
      refreshFigurines();
    } catch (error) {
      console.error("Error uploading model:", error);
      toast({
        title: "Upload failed",
        description: "Failed to update the figurine with the model URL",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <FigurineList
        figurines={figurines}
        loading={loading}
        error={error}
        onDownload={handleDownload}
        onViewModel={handleViewModel}
        onTogglePublish={handleTogglePublish}
        onUploadModel={handleUploadModel}
      />

      <FigurineModelDialog 
        open={modelViewerOpen} 
        onOpenChange={setModelViewerOpen}
        selectedFigurine={selectedFigurine}
      />

      <UploadModelModal
        isOpen={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onModelUpload={handleModelUpload}
      />
    </>
  );
};

export default FigurineGallery;
