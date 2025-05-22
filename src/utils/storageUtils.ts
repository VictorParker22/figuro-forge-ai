
import { supabase } from "@/integrations/supabase/client";

// Save image to storage and get public URL
export const saveImageToStorage = async (imageBlob: Blob, figurineId: string): Promise<string | null> => {
  try {
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
