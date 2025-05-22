import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadModelModal from "@/components/UploadModelModal";
import { BucketImage } from "@/components/gallery/types";
import GalleryHeader from "@/components/gallery/GalleryHeader";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import ModelViewerDialog from "@/components/gallery/ModelViewerDialog";
import CallToAction from "@/components/gallery/CallToAction";

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
        variant: "default",
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
