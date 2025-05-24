import { supabase } from "@/integrations/supabase/client";

// Save image to storage and get public URL
export const saveImageToStorage = async (imageBlob: Blob, figurineId: string): Promise<string | null> => {
  try {
    // Use a public storage path that doesn't require authentication
    const filePath = `public/${figurineId}.png`;
    
    // Upload image to storage
    const { data, error } = await supabase.storage
      .from('figurine-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      
      // If the bucket doesn't exist yet, try to create it
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        try {
          // Try to create bucket
          const { error: createError } = await supabase.storage.createBucket('figurine-images', {
            public: true,
          });
          
          if (!createError) {
            console.log('Created figurine-images bucket');
            
            // Retry upload after bucket creation
            const { data: retryData, error: retryError } = await supabase.storage
              .from('figurine-images')
              .upload(filePath, imageBlob, {
                contentType: 'image/png',
                upsert: true
              });
              
            if (retryError) {
              console.error('Storage retry upload failed:', retryError);
              return null;
            }
          } else {
            console.error('Failed to create bucket:', createError);
            return null;
          }
        } catch (bucketError) {
          console.error('Error creating bucket:', bucketError);
          return null;
        }
      }
      
      return null;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('figurine-images')
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to save image to storage:', error);
    return null;
  }
};