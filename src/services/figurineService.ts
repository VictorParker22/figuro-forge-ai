
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
    const userId = session?.user?.id || null;
    
    // Generate a new ID for the figurine
    const figurineId = uuidv4();
    
    // Save image to storage if we have a blob
    let savedImageUrl = null;
    if (imageBlob) {
      savedImageUrl = await saveImageToStorage(imageBlob, figurineId);
    }
    
    // Create figurine data object
    const figurineData = {
      id: figurineId,
      user_id: userId,
      prompt: prompt,
      style: style as any, // Cast to any to bypass the strict enum type check
      image_url: imageUrl,
      saved_image_url: savedImageUrl,
      title: prompt.substring(0, 50),
      is_public: true // Set all figurines as public by default
    };
    
    // Insert new figurine
    await supabase.from('figurines').insert(figurineData);
    
    return figurineId;
  } catch (error) {
    console.error('Error saving figurine:', error);
    return null;
  }
};

// Update an existing figurine with a model URL
export const updateFigurineWithModelUrl = async (figurineId: string, modelUrl: string): Promise<void> => {
  try {
    await supabase.from('figurines').update({
      model_url: modelUrl
    }).eq('id', figurineId);
  } catch (error) {
    console.error('Error updating figurine with model URL:', error);
  }
};

// Fetch all public figurines for the gallery
export const fetchPublicFigurines = async (): Promise<Figurine[]> => {
  try {
    const { data, error } = await supabase
      .from('figurines')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching public figurines:', error);
    return [];
  }
};
