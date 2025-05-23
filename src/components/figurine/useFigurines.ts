
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Figurine } from '@/types/figurine';
import { useToast } from '@/hooks/use-toast';

export const useFigurines = () => {
  const [figurines, setFigurines] = useState<Figurine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFigurines = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setFigurines([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('figurines')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
          
      if (error) throw error;
      
      // Make sure all required properties exist in the data by casting to our Figurine type
      const processedData = (data || []).map(figurine => ({
        id: figurine.id,
        title: figurine.title || "Untitled Figurine",
        prompt: figurine.prompt || "",
        style: figurine.style || "",
        image_url: figurine.image_url || "",
        saved_image_url: figurine.saved_image_url || null,
        model_url: figurine.model_url || null,
        created_at: figurine.created_at || new Date().toISOString(),
        user_id: figurine.user_id,
        is_public: figurine.is_public || false
      }));
      
      setFigurines(processedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching figurines:', err);
      setError('Failed to load your figurines');
      toast({
        title: "Error loading figurines",
        description: err.message || "Could not load your figurines",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
    
  useEffect(() => {
    fetchFigurines();
    
    // Subscribe to changes in the figurines table
    const subscription = supabase
      .channel('figurines-channel')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'figurines' }, 
          () => {
            console.log("Figurines table changed, refreshing data");
            fetchFigurines();
          }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchFigurines]);

  return { figurines, loading, error, refreshFigurines: fetchFigurines };
};
