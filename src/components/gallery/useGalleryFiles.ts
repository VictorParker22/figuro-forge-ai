
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Type definitions
interface BucketImage {
  name: string;
  url: string;
  id: string;
  created_at: string;
  fullPath?: string;
  type: 'image' | '3d-model';
}

export const useGalleryFiles = () => {
  const [images, setImages] = useState<BucketImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchImagesFromBucket = async (reset = false) => {
    try {
      setIsLoading(true);
      const pageSize = 24; // Number of items per page
      
      // Reset to first page if requested
      if (reset) {
        setCurrentPage(1);
      }
      
      const page = reset ? 1 : currentPage;
      
      // Get all files from the bucket
      const { data: bucketFiles, error } = await supabase.storage
        .from('figurine-images')
        .list('', {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          sortBy: { column: 'created_at', order: 'desc' }
        });
      
      if (error) {
        console.error('Error fetching bucket files:', error);
        setIsLoading(false);
        return;
      }
      
      if (!bucketFiles || bucketFiles.length === 0) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }
      
      // Process the files and create URLs
      const processedImages: BucketImage[] = [];
      
      // Process each file to determine if it's an image or a 3D model
      for (const file of bucketFiles) {
        // Skip folders and other non-file items
        if (file.id === undefined || file.name === '.emptyFolderPlaceholder') continue;
        
        // Determine file type based on extension or path
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const isModel = fileExt === 'glb' || fileExt === 'gltf' || 
                        file.name.includes('model') || file.metadata?.type === 'model/gltf-binary';
        const isImage = !isModel && 
                       (fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg' || 
                        fileExt === 'webp' || fileExt === 'gif');
        
        // Skip files that aren't images or 3D models
        if (!isImage && !isModel) continue;
        
        // Get the public URL for the file
        const { data: publicUrlData } = supabase.storage
          .from('figurine-images')
          .getPublicUrl(file.name);
        
        if (publicUrlData) {
          processedImages.push({
            name: file.name,
            url: publicUrlData.publicUrl,
            id: file.id,
            created_at: file.created_at || new Date().toISOString(),
            fullPath: file.name,
            type: isModel ? '3d-model' : 'image'
          });
        }
      }
      
      if (reset) {
        setImages(processedImages);
      } else {
        setImages(prev => [...prev, ...processedImages]);
      }
      
      // Update pagination state
      setHasMore(bucketFiles.length >= pageSize);
      setCurrentPage(reset ? 2 : page + 1);
      
    } catch (error) {
      console.error('Error processing bucket files:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchImagesFromBucket();
    }
  };

  // Initial load
  useEffect(() => {
    fetchImagesFromBucket(true);
    
    // Set up a listener for storage changes
    const subscription = supabase
      .channel('storage-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'storage', 
          table: 'objects' 
        },
        () => {
          // Refresh the images when storage changes
          fetchImagesFromBucket(true);
        }
      )
      .subscribe();
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    images,
    isLoading,
    hasMore,
    fetchImagesFromBucket,
    loadMore
  };
};

export default useGalleryFiles;
