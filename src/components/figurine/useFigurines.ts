
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
      const processedData = (data || []).map(figurine => {
        // Clean image URLs from any cache busting parameters
        let imageUrl = figurine.image_url || "";
        let savedImageUrl = figurine.saved_image_url || null;
        let modelUrl = figurine.model_url || null;
        
        // Helper function to clean URLs
        const cleanUrl = (url: string) => {
          try {
            if (!url) return url;
            const parsedUrl = new URL(url);
            ['t', 'cb', 'cache'].forEach(param => {
              if (parsedUrl.searchParams.has(param)) {
                parsedUrl.searchParams.delete(param);
              }
            });
            return parsedUrl.toString();
          } catch (e) {
            return url;
          }
        };
        
        // Clean all URLs
        if (imageUrl) imageUrl = cleanUrl(imageUrl);
        if (savedImageUrl) savedImageUrl = cleanUrl(savedImageUrl);
        if (modelUrl) modelUrl = cleanUrl(modelUrl);
        
        return {
          id: figurine.id,
          title: figurine.title || "Untitled Figurine",
          prompt: figurine.prompt || "",
          style: figurine.style || "",
          image_url: imageUrl,
          saved_image_url: savedImageUrl,
          model_url: modelUrl,
          created_at: figurine.created_at || new Date().toISOString(),
          user_id: figurine.user_id,
          is_public: figurine.is_public || false
        };
      });
      
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
