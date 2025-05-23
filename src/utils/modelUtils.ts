
import { supabase } from "@/integrations/supabase/client";

/**
 * Downloads a 3D model from an external URL and saves it to Supabase storage
 * @param modelUrl External URL of the 3D model
 * @param filename Name to save the file as (without extension)
 * @returns The storage URL of the saved model
 */
export const downloadAndSaveModel = async (modelUrl: string, filename: string): Promise<string | null> => {
  try {
    console.log(`Downloading model from: ${modelUrl}`);
    
    // Download the model file from the external URL
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
    }
    
    // Get the model file as a blob
    const modelBlob = await response.blob();
    
    // Generate a unique filename with the correct extension
    const extension = modelUrl.split('.').pop()?.toLowerCase() || 'glb';
    const uniqueFilename = `models/${filename.replace(/\s+/g, '_')}_${Date.now()}.${extension}`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('figurine-images')
      .upload(uniqueFilename, modelBlob, {
        contentType: 'model/gltf-binary',
        upsert: true
      });
      
    if (error) {
      console.error('Error saving model to storage:', error);
      return null;
    }
    
    // Get the public URL of the saved model
    const { data: publicUrlData } = supabase.storage
      .from('figurine-images')
      .getPublicUrl(uniqueFilename);
      
    console.log(`Model saved to storage: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to download and save model:', error);
    return null;
  }
};
