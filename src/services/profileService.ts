
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
      return 10; // Default to allowing 10 generations (increased from 4)
    }
    
    // Cast profileData to our more flexible Profile type
    const profile = profileData as Profile;
    
    // Check if generation_count exists and is a number
    const generationCount = profile && typeof profile.generation_count === 'number' 
      ? profile.generation_count 
      : 0;
    
    // Users are allowed 10 generations (increased from 4)
    return Math.max(0, 10 - generationCount);
  } catch (err) {
    console.error('Error checking generations:', err);
    return 10; // Default to allowing 10 generations if we can't check (increased from 4)
  }
};

// Increment the user's generation count using RPC or direct update
export const incrementGenerationCount = async (): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    // Define the type for the RPC parameters
    type IncrementParams = {
      inc_amount: number;
      table_name: string;
      column_name: string;
      id: string;
      id_column: string;
    }
    
    // Use type assertion with a specific type to fix the TypeScript error
    const { error: rpcError } = await supabase.rpc<any>('increment', {
      inc_amount: 1,
      table_name: 'profiles',
      column_name: 'generation_count',
      id: session.user.id,
      id_column: 'id'
    } as IncrementParams);
    
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
        
        // Use a safe update approach
        await supabase
          .from('profiles')
          .update({ 
            generation_count: currentCount + 1 
          })
          .eq('id', session.user.id);
      }
    }
  } catch (error) {
    console.error('Error updating generation count:', error);
  }
};
