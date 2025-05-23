
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
      console.log('Image saved to storage:', savedImageUrl);
    } else if (imageUrl) {
      // If we only have an URL but no blob, fetch the image and save it
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        savedImageUrl = await saveImageToStorage(blob, figurineId);
        console.log('Image fetched and saved to storage:', savedImageUrl);
      } catch (fetchError) {
        console.error('Error fetching image from URL:', fetchError);
      }
    }
    
    // Create figurine data object
    const figurineData = {
      id: figurineId,
      user_id: userId,
      prompt: prompt,
      style: style as any, // Cast to any to bypass the strict enum type check
      image_url: imageUrl,
      saved_image_url: savedImageUrl || imageUrl, // Fallback to original URL if storage failed
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
    throw error;
  }
};

// Update the public status of a figurine
export const updateFigurinePublicStatus = async (figurineId: string, isPublic: boolean): Promise<void> => {
  try {
    await supabase.from('figurines').update({
      is_public: isPublic
    }).eq('id', figurineId);
  } catch (error) {
    console.error('Error updating figurine public status:', error);
    throw error;
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
    
    // Map figurines to include best available image URL
    const processedFigurines = (data || []).map((figurine) => {
      // Use saved_image_url if available, otherwise fall back to image_url
      let imageUrl = figurine.saved_image_url || figurine.image_url;
      
      // Add a cache-busting parameter to force reloading if it's a storage URL
      if (imageUrl && imageUrl.includes('supabase.co')) {
        const cacheBuster = `?t=${Date.now()}`;
        imageUrl = imageUrl.includes('?') ? `${imageUrl}&cb=${Date.now()}` : `${imageUrl}${cacheBuster}`;
      }
      
      return {
        ...figurine,
        display_url: imageUrl
      };
    });
    
    return processedFigurines;
  } catch (error) {
    console.error('Error fetching public figurines:', error);
    return [];
  }
};
