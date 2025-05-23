
import { supabase } from "@/integrations/supabase/client";

/**
 * Downloads a 3D model from an external URL and saves it to Supabase storage
 * @param modelUrl External URL of the 3D model
 * @param filename Name to save the file as (without extension)
 * @param metadata Optional metadata about the model
 * @returns The storage URL of the saved model
 */
export const downloadAndSaveModel = async (
  modelUrl: string, 
  filename: string,
  metadata: { 
    sourceImageUrl?: string;
    prompt?: string;
    figurineId?: string;
    isStandalone?: boolean;
  } = {}
): Promise<string | null> => {
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
    const timestamp = Date.now();
    
    // Determine the appropriate path based on metadata
    let storagePath = '';
    if (metadata.figurineId) {
      // If it's associated with a figurine, use the figurine path
      storagePath = `models/figurine_${metadata.figurineId}_${timestamp}.${extension}`;
    } else {
      // For standalone models, use a dedicated path
      const sanitizedFilename = filename.replace(/\s+/g, '_');
      storagePath = `models/standalone/${sanitizedFilename}_${timestamp}.${extension}`;
    }
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('figurine-images')
      .upload(storagePath, modelBlob, {
        contentType: 'model/gltf-binary',
        upsert: true,
        // Add metadata as custom headers
        cacheControl: '3600',
        metadata: {
          sourceImage: metadata.sourceImageUrl || '',
          prompt: metadata.prompt || '',
          figurineId: metadata.figurineId || '',
          isStandalone: metadata.isStandalone ? 'true' : 'false',
          createdAt: new Date().toISOString()
        }
      });
      
    if (error) {
      console.error('Error saving model to storage:', error);
      return null;
    }
    
    // Get the public URL of the saved model
    const { data: publicUrlData } = supabase.storage
      .from('figurine-images')
      .getPublicUrl(storagePath);
      
    console.log(`Model saved to storage: ${publicUrlData.publicUrl}`);
    
    // Update figurine record with model URL if it has a figurineId
    if (metadata.figurineId) {
      try {
        const { error: updateError } = await supabase
          .from('figurines')
          .update({ model_url: publicUrlData.publicUrl })
          .eq('id', metadata.figurineId);
          
        if (updateError) {
          console.error('Error updating figurine with model URL:', updateError);
        }
      } catch (err) {
        console.error('Failed to update figurine record:', err);
      }
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to download and save model:', error);
    return null;
  }
};
