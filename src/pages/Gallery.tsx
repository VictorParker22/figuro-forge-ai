import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadModelModal from "@/components/UploadModelModal";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import ModelViewerDialog from "@/components/gallery/ModelViewerDialog";
import CallToAction from "@/components/gallery/CallToAction";
import { useGalleryFiles } from "@/components/gallery/useGalleryFiles";
import { useModelUpload } from "@/components/gallery/useModelUpload";
import { useModelViewer } from "@/components/gallery/useModelViewer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";

const Gallery = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
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
  
  const handleDownload = async (imageUrl: string, imageName: string) => {
    if (!imageUrl) return;
    
    try {
      // Fetch the file as a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create an object URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = imageName || 'figurine.png';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      toast({
        title: "Download started",
        description: `Downloading ${imageName || 'file'}`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: "There was a problem downloading the file",
        variant: "destructive"
      });
    }
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
                <EnhancedModelViewer 
                  modelUrl={customModelUrl} 
                  isLoading={false}
                  title={customModelFile?.name || "Uploaded Model"}
                  creatorName={profile?.full_name || user?.email?.split('@')[0] || "You"}
                  creatorAvatar={profile?.avatar_url}
                  createdAt={new Date().toISOString()}
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
        modelName={viewingModel?.split('/').pop()?.split('?')[0] || "3D Model"}
        creatorName={profile?.full_name || user?.email?.split('@')[0] || "Anonymous"}
        creatorAvatar={profile?.avatar_url}
        createdAt={new Date().toISOString()}
      />
      
      <Footer />
    </div>
  );
};

export default Gallery;