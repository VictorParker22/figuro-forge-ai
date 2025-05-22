
import { supabase } from "@/integrations/supabase/client";

// Ensure the figurine-images bucket exists
export const ensureBucketExists = async (): Promise<void> => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'figurine-images');
    
    // Create the bucket if it doesn't exist
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('figurine-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Failed to create figurine-images bucket:', error);
      } else {
        console.log('Created figurine-images bucket successfully');
      }
    }
  } catch (error) {
    console.error('Error checking/creating bucket:', error);
  }
};

// Save image to storage and get public URL
export const saveImageToStorage = async (imageBlob: Blob, figurineId: string): Promise<string | null> => {
  try {
    // Ensure the bucket exists
    await ensureBucketExists();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    const filePath = `${session.user.id}/${figurineId}.png`;
    
    // Upload image to storage
    const { data, error } = await supabase.storage
      .from('figurine-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Storage upload error:', error);
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
