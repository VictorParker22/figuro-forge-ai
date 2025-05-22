
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { Figurine } from "@/types/figurine";
import { saveImageToStorage } from "@/utils/storageUtils";

// Save a new figurine to the database
export const saveFigurine = async (
  prompt: string, 
  style: string, 
  imageUrl: string, 
  imageBlob: Blob | null
): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    // Generate a new ID for the figurine
    const figurineId = uuidv4();
    
    // Save image to storage if we have a blob
    let savedImageUrl = null;
    if (imageBlob) {
      savedImageUrl = await saveImageToStorage(imageBlob, figurineId);
    }
    
    // Insert new figurine - use type casting to handle the style enum
    await supabase.from('figurines').insert({
      id: figurineId,
      user_id: session.user.id,
      prompt: prompt,
      style: style as any, // Cast to any to bypass the strict enum type check
      image_url: imageUrl,
      saved_image_url: savedImageUrl,
      title: prompt.substring(0, 50)
    });
    
    return figurineId;
  } catch (error) {
    console.error('Error saving figurine:', error);
    return null;
  }
};

// Update an existing figurine with a model URL
export const updateFigurineWithModelUrl = async (figurineId: string, modelUrl: string): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    await supabase.from('figurines').update({
      model_url: modelUrl
    }).eq('id', figurineId);
  } catch (error) {
    console.error('Error updating figurine with model URL:', error);
  }
};
