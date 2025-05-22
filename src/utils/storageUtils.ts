
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
        // Continue execution even if bucket creation fails
        // The bucket might already exist at the project level but not visible to the user
      } else {
        console.log('Created figurine-images bucket successfully');
      }
    }
  } catch (error) {
    console.error('Error checking/creating bucket:', error);
    // Continue execution even with error
  }
};

// Save image to storage and get public URL
export const saveImageToStorage = async (imageBlob: Blob, figurineId: string): Promise<string | null> => {
  try {
    // Try to ensure the bucket exists, but don't block on failure
    await ensureBucketExists().catch(err => console.warn('Bucket check failed but continuing:', err));
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn('No authenticated user found, using anonymous upload');
      // Use a default path for anonymous users
      const filePath = `anonymous/${figurineId}.png`;
      
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
    }
    
    // User is authenticated, use their ID in the path
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
      // If error is due to permissions, try uploading to a public folder
      if (error.message?.includes('policy') || error.status === 400) {
        console.log('Trying alternative public upload path due to permission issues');
        const publicFilePath = `public/${figurineId}.png`;
        
        const { data: publicData, error: publicError } = await supabase.storage
          .from('figurine-images')
          .upload(publicFilePath, imageBlob, {
            contentType: 'image/png',
            upsert: true
          });
          
        if (publicError) {
          console.error('Public storage upload also failed:', publicError);
          return null;
        }
        
        // Get public URL from alternative path
        const { data: publicUrlData } = supabase.storage
          .from('figurine-images')
          .getPublicUrl(publicFilePath);
          
        return publicUrlData.publicUrl;
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
