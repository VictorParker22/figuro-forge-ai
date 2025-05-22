
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/figurine";

// Fetch remaining generations for a user - always returns unlimited (no limit)
export const getRemainingGenerations = async (): Promise<number> => {
  // Return a large number to effectively disable the limit
  return 9999;
};

// Increment the user's generation count using RPC or direct update
export const incrementGenerationCount = async (): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    // Define a proper interface for the RPC parameters to resolve the type issue
    interface IncrementParams {
      inc_amount: number;
      table_name: string;
      column_name: string;
      id: string;
      id_column: string;
    }
    
    // Use a properly typed approach for the RPC call
    const { error: rpcError } = await supabase.rpc<IncrementParams>('increment', {
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
