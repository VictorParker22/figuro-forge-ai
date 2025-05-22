
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadModelModal from "@/components/UploadModelModal";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import ModelViewerDialog from "@/components/gallery/ModelViewerDialog";
import CallToAction from "@/components/gallery/CallToAction";
import ModelViewer from "@/components/model-viewer";
import { useGalleryFiles } from "@/components/gallery/useGalleryFiles";
import { useModelUpload } from "@/components/gallery/useModelUpload";
import { useModelViewer } from "@/components/gallery/useModelViewer";

const Gallery = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Use custom hooks to manage gallery functionality
  const { images, isLoading, fetchImagesFromBucket } = useGalleryFiles();
  const { customModelUrl, customModelFile, handleModelUpload } = useModelUpload(fetchImagesFromBucket);
  const { 
    viewingModel, 
    modelViewerOpen, 
    setModelViewerOpen, 
    handleViewModel, 
    handleCloseModelViewer 
  } = useModelViewer();

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Any cleanup needed
    };
  }, []);

  const handleNavigateToStudio = () => {
    navigate('/studio');
  };
  
  const handleDownload = (imageUrl: string, imageName: string) => {
    if (!imageUrl) return;
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = imageName || 'figurine.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <GalleryHeader onUploadClick={() => setUploadModalOpen(true)} />
          
          {customModelUrl && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-4 text-gradient text-center">Preview Your Uploaded Model</h2>
              <div className="max-w-3xl mx-auto">
                <ModelViewer 
                  modelUrl={customModelUrl} 
                  isLoading={false}
                />
              </div>
            </div>
          )}
          
          <GalleryGrid 
            images={images}
            isLoading={isLoading}
            onDownload={handleDownload}
            onViewModel={handleViewModel}
          />
        </div>
      </section>
      
      <CallToAction onNavigateToStudio={handleNavigateToStudio} />
      
      {/* Upload Model Modal */}
      <UploadModelModal 
        isOpen={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onModelUpload={handleModelUpload}
      />
      
      {/* 3D Model Viewer Dialog */}
      <ModelViewerDialog
        open={modelViewerOpen}
        onOpenChange={setModelViewerOpen}
        modelUrl={viewingModel}
        onClose={handleCloseModelViewer}
      />
      
      <Footer />
    </div>
  );
};

export default Gallery;
