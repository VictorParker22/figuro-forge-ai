import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Image, Box, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGalleryFiles } from "@/components/gallery/useGalleryFiles";
import ModelPreview from "@/components/gallery/ModelPreview";
import ModelPlaceholder from "@/components/gallery/ModelPlaceholder";
import ModelViewerDialog from "@/components/gallery/ModelViewerDialog";
import { useModelViewer } from "@/components/gallery/useModelViewer";

const HomepageGallery: React.FC = () => {
  const { images, isLoading } = useGalleryFiles();
  const navigate = useNavigate();
  
  // Set up model viewer functionality
  const { 
    viewingModel, 
    modelViewerOpen, 
    setModelViewerOpen, 
    handleViewModel, 
    handleCloseModelViewer 
  } = useModelViewer();
  
  // Limit to 10 items for homepage display
  const limitedImages = React.useMemo(() => {
    return images.slice(0, 10);
  }, [images]);

  const navigateToGallery = useCallback(() => {
    navigate("/gallery");
  }, [navigate]);

  const navigateToStudio = useCallback(() => {
    navigate("/studio");
  }, [navigate]);
  
  // Handle downloads with a proper function that ensures content is downloaded
  const handleDownload = async (imageUrl: string, imageName: string) => {
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
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          className="flex flex-col items-center mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
            Latest Creations
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Explore the latest figurines created by our community. Get inspired and start creating your own unique designs.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {Array(10).fill(0).map((_, index) => (
              <div key={index} className="glass-panel h-48 md:h-40">
                <Skeleton className="h-full w-full bg-white/5 loading-shine" />
              </div>
            ))}
          </div>
        ) : limitedImages.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {limitedImages.map((file, index) => (
                <motion.div
                  key={file.id}
                  className="glass-panel overflow-hidden aspect-square relative group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <div className="w-full h-full">
                    {file.type === '3d-model' ? (
                      <ModelPreview 
                        modelUrl={file.url} 
                        fileName={file.name} 
                      />
                    ) : (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 backdrop-blur-md bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center">
                    <div className="p-4 w-full flex flex-col items-center">
                      <div className="flex items-center gap-1 mb-2">
                        {file.type === '3d-model' ? (
                          <Box size={14} className="text-figuro-accent" />
                        ) : (
                          <Image size={14} className="text-white/70" />
                        )}
                        <span className="text-xs text-white/90">
                          {file.type === '3d-model' ? "3D Model" : "Image"}
                        </span>
                      </div>
                      
                      {file.type === '3d-model' ? (
                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            onClick={() => handleViewModel(file.url)}
                            size="sm"
                            className="w-full bg-figuro-accent hover:bg-figuro-accent-hover h-8 px-3"
                          >
                            <Eye size={14} className="mr-1.5" /> View Model
                          </Button>
                          <Button
                            onClick={() => handleDownload(file.url, file.name)}
                            size="sm"
                            variant="outline"
                            className="w-full border-white/10 h-8 px-3"
                          >
                            <Download size={14} className="mr-1.5" /> Download
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleDownload(file.url, file.name)}
                          size="sm"
                          className="w-full bg-figuro-accent hover:bg-figuro-accent-hover h-8 px-3"
                        >
                          <Download size={14} className="mr-1.5" /> Download
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <Button
                onClick={navigateToGallery}
                className="bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
              >
                View Full Gallery <ArrowRight size={16} />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/70">No images found in the gallery yet. Be the first to create one!</p>
            <Button
              onClick={navigateToStudio}
              className="mt-4 bg-figuro-accent hover:bg-figuro-accent-hover"
            >
              Create Your First Figurine
            </Button>
          </div>
        )}
      </div>
      
      {/* Model Viewer Dialog for 3D models */}
      <ModelViewerDialog
        open={modelViewerOpen}
        onOpenChange={setModelViewerOpen}
        modelUrl={viewingModel}
        onClose={handleCloseModelViewer}
      />
    </section>
  );
};

export default React.memo(HomepageGallery);