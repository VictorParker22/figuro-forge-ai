import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Download, Upload, Box, Image as ImageIcon, Eye, X } from "lucide-react";
import UploadModelModal from "@/components/UploadModelModal";
import ModelViewer from "@/components/model-viewer";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface BucketImage {
  name: string;
  url: string;
  id: string;
  created_at: string;
  fullPath?: string;
  type: 'image' | '3d-model';  // Add type property to distinguish between images and 3D models
}

// Maximum number of model viewers that can be open at once
const MAX_ACTIVE_VIEWERS = 1;

const Gallery = () => {
  const [images, setImages] = useState<BucketImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [viewingModel, setViewingModel] = useState<string | null>(null);
  const [modelViewerOpen, setModelViewerOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Keep track of active model viewers to limit resource usage
  const activeViewersRef = useRef<number>(0);
  
  // Helper function to determine file type based on extension
  const getFileType = (filename: string): 'image' | '3d-model' => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (extension === 'glb') {
      return '3d-model';
    }
    return 'image';
  };
  
  // Recursive function to list files in a folder and its subfolders
  const listFilesRecursively = async (path: string = ''): Promise<BucketImage[]> => {
    // List files in the current path
    const { data: files, error } = await supabase
      .storage
      .from('figurine-images')
      .list(path, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (error) {
      console.error("Error listing files:", error);
      return [];
    }
    
    if (!files || files.length === 0) {
      return [];
    }
    
    // Separate folders and files
    const folders = files.filter(item => item.id === null);
    const actualFiles = files.filter(item => item.id !== null);
    
    // Process current path's files
    const processedFiles = await Promise.all(
      actualFiles.map(async (file) => {
        const fullPath = path ? `${path}/${file.name}` : file.name;
        const { data: publicUrlData } = supabase.storage
          .from('figurine-images')
          .getPublicUrl(fullPath);
        
        return {
          name: file.name,
          fullPath: fullPath,
          url: publicUrlData.publicUrl,
          id: file.id || fullPath,
          created_at: file.created_at || new Date().toISOString(),
          type: getFileType(file.name) // Determine file type based on extension
        };
      })
    );
    
    // Recursively process subfolders
    let filesFromSubFolders: BucketImage[] = [];
    for (const folder of folders) {
      const subPath = path ? `${path}/${folder.name}` : folder.name;
      const subFolderFiles = await listFilesRecursively(subPath);
      filesFromSubFolders = [...filesFromSubFolders, ...subFolderFiles];
    }
    
    // Combine files from current path and subfolders
    return [...processedFiles, ...filesFromSubFolders];
  };
  
  // Load all images and models from the bucket
  useEffect(() => {
    const fetchImagesFromBucket = async () => {
      setIsLoading(true);
      try {
        // Get all files recursively, starting from root
        const allFiles = await listFilesRecursively();
        
        // Sort by creation date (newest first)
        allFiles.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setImages(allFiles);
      } catch (error) {
        console.error("Error loading files from bucket:", error);
        toast({
          title: "Error loading gallery",
          description: "Could not load the gallery items. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImagesFromBucket();
    
    // Also set up a subscription to listen for storage changes
    const channel = supabase
      .channel('storage-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'storage', table: 'objects', filter: "bucket_id=eq.figurine-images" }, 
          () => {
            // When storage changes, refetch the files
            fetchImagesFromBucket();
          }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
  
  // Clean up WebGL context when component unmounts or when model viewers are closed
  useEffect(() => {
    return () => {
      // Reset active viewers count when component unmounts
      activeViewersRef.current = 0;
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

  const handleViewModel = (modelUrl: string) => {
    // Check if we're already at the maximum number of active viewers
    if (activeViewersRef.current >= MAX_ACTIVE_VIEWERS) {
      toast({
        title: "Too many viewers open",
        description: "Please close the current model viewer before opening another one.",
        variant: "warning",
      });
      return;
    }
    
    setViewingModel(modelUrl);
    setModelViewerOpen(true);
    activeViewersRef.current += 1;
  };
  
  const handleCloseModelViewer = () => {
    setModelViewerOpen(false);
    activeViewersRef.current = Math.max(0, activeViewersRef.current - 1);
  };

  // Handle model upload from modal
  const handleModelUpload = (url: string, file: File) => {
    setCustomModelUrl(url);
    setCustomModelFile(file);
    
    // Upload to storage 
    const uploadModel = async () => {
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `models/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('figurine-images')
          .upload(filePath, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('figurine-images')
          .getPublicUrl(filePath);
          
        toast({
          title: "Model uploaded",
          description: `Your 3D model has been uploaded to the gallery`,
        });
        
        // Refresh the gallery
        const fetchFiles = async () => {
          const allFiles = await listFilesRecursively();
          allFiles.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setImages(allFiles);
        };
        
        fetchFiles();
      } catch (error) {
        console.error('Error uploading model:', error);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your model",
          variant: "destructive"
        });
      }
    };
    
    uploadModel();
  };

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gradient">Community Gallery</h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              See figurines and 3D models created by the community. Upload your own 3D models to share!
            </p>
            
            <div className="flex justify-center mt-8">
              <Button 
                onClick={() => setUploadModalOpen(true)}
                className="bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
              >
                <Box size={18} />
                Upload 3D Model
              </Button>
            </div>
          </motion.div>
          
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
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="glass-panel">
                  <CardContent className="p-0">
                    <div className="aspect-square w-full">
                      <Skeleton className="h-full w-full bg-white/5 loading-shine" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((file, index) => (
                <motion.div 
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-panel rounded-lg overflow-hidden group"
                >
                  <div className="aspect-square relative overflow-hidden bg-white/5">
                    {file.type === 'image' ? (
                      <img 
                        src={`${file.url}?t=${Date.now()}`} 
                        alt={file.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-800/50">
                        <div className="relative w-16 h-16 mb-3">
                          <Box size={64} className="text-figuro-accent absolute inset-0" />
                          <div className="absolute inset-0 animate-pulse bg-figuro-accent/20 rounded-md"></div>
                        </div>
                        <p className="text-center text-sm font-medium truncate max-w-full">
                          {file.name}
                        </p>
                        <p className="text-white/50 text-xs mt-1">3D Model</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-4 w-full">
                        {file.type === 'image' ? (
                          <Button 
                            onClick={() => handleDownload(file.url, file.name)}
                            className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
                          >
                            <Download size={16} className="mr-2" /> Download
                          </Button>
                        ) : (
                          <div className="flex flex-col space-y-2 w-full">
                            <Button 
                              onClick={() => handleViewModel(file.url)}
                              className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
                            >
                              <Eye size={16} className="mr-2" /> View Model
                            </Button>
                            <Button 
                              onClick={() => handleDownload(file.url, file.name)}
                              variant="outline"
                              className="w-full border-white/10"
                            >
                              <Download size={16} className="mr-2" /> Download
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-white/70 mb-4">No images found in the bucket yet.</p>
              <p className="text-white/50 mb-8">Be the first to create one!</p>
            </div>
          )}
        </div>
      </section>
      
      <section className="py-16 bg-gradient-to-b from-transparent to-figuro-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gradient">
              Ready to create your own figurine?
            </h2>
            <Button 
              className="bg-figuro-accent hover:bg-figuro-accent-hover text-white px-8 py-6 text-lg"
              onClick={handleNavigateToStudio}
            >
              Launch Studio
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Upload Model Modal */}
      <UploadModelModal 
        isOpen={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onModelUpload={handleModelUpload}
      />
      
      {/* 3D Model Viewer Dialog */}
      <Dialog open={modelViewerOpen} onOpenChange={handleCloseModelViewer}>
        <DialogContent className="sm:max-w-[800px] p-0 bg-gray-900/90 border border-white/10">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="flex justify-between items-center">
              <span>3D Model Viewer</span>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" onClick={handleCloseModelViewer} className="h-8 w-8">
                  <X size={16} />
                </Button>
              </DialogClose>
            </DialogTitle>
          </DialogHeader>
          {viewingModel && (
            <ModelViewer 
              modelUrl={viewingModel}
              isLoading={false}
            />
          )}
          <DialogFooter className="p-4 border-t border-white/10">
            <p className="text-xs text-white/50">
              Note: Only one 3D model can be viewed at a time to ensure optimal performance.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Gallery;
