
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/figurine";

// Fetch remaining generations for a user
export const getRemainingGenerations = async (): Promise<number> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return 0;
    }

    // Get profile with proper error handling
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return 4; // Default to allowing generations
    }
    
    // Cast profileData to our more flexible Profile type
    const profile = profileData as Profile;
    
    // Check if generation_count exists and is a number
    const generationCount = profile && typeof profile.generation_count === 'number' 
      ? profile.generation_count 
      : 0;
    
    // Users are allowed 4 generations
    return Math.max(0, 4 - generationCount);
  } catch (err) {
    console.error('Error checking generations:', err);
    return 4; // Default to allowing generations if we can't check
  }
};

// Increment the user's generation count using RPC or direct update
export const incrementGenerationCount = async (): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    // Try using the RPC function first
    const { error: rpcError } = await supabase.rpc('increment', {
      inc_amount: 1,
      table_name: 'profiles',
      column_name: 'generation_count',
      id: session.user.id,
      id_column: 'id'
    });
    
    if (rpcError) {
      console.error('Error incrementing generation count via RPC:', rpcError);
      
      // Fallback: Use direct update if RPC fails
      // Get current profile data first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileData) {
        const profile = profileData as Profile;
        const currentCount = typeof profile.generation_count === 'number' ? profile.generation_count : 0;
        
        // Use a safe update approach with a cast to handle the flexible type
        await supabase
          .from('profiles')
          .update({ 
            generation_count: currentCount + 1 
          } as any)
          .eq('id', session.user.id);
      }
    }
  } catch (error) {
    console.error('Error updating generation count:', error);
  }
};
