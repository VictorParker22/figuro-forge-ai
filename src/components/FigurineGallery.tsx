
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import { Figurine } from '@/types/figurine';

const FigurineGallery = () => {
  const [figurines, setFigurines] = useState<Figurine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFigurine, setSelectedFigurine] = useState<Figurine | null>(null);

  useEffect(() => {
    const fetchFigurines = async () => {
      try {
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
          title: figurine.title || "",
          prompt: figurine.prompt,
          style: figurine.style,
          image_url: figurine.image_url || "",
          saved_image_url: figurine.saved_image_url || null,
          model_url: figurine.model_url || null,
          created_at: figurine.created_at || new Date().toISOString(),
          user_id: figurine.user_id,
          is_public: figurine.is_public
        }));
        
        setFigurines(processedData);
      } catch (err) {
        console.error('Error fetching figurines:', err);
        setError('Failed to load your figurines');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFigurines();
    
    // Subscribe to changes in the figurines table
    const subscription = supabase
      .channel('figurines-channel')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'figurines' }, 
          fetchFigurines)
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDownload = (figurine: Figurine) => {
    const imageUrl = figurine.saved_image_url || figurine.image_url;
    if (!imageUrl) return;
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `figurine-${figurine.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-panel">
            <CardHeader>
              <Skeleton className="h-6 w-2/3 bg-white/5" />
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full">
                <Skeleton className="h-full w-full bg-white/5 loading-shine" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-destructive py-8">{error}</div>;
  }

  if (figurines.length === 0) {
    return (
      <div className="text-center py-8 text-white/70">
        <p>No figurines yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {figurines.map((figurine) => (
        <motion.div 
          key={figurine.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-panel overflow-hidden">
            <CardHeader className="p-3 border-b border-white/10">
              <CardTitle className="text-sm font-medium truncate">{figurine.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-square w-full p-2">
                <img 
                  src={figurine.saved_image_url || figurine.image_url} 
                  alt={figurine.title}
                  className="w-full h-full object-contain rounded-md"
                  loading="lazy" 
                />
              </div>
            </CardContent>
            <CardFooter className="p-2 gap-2 flex justify-between">
              <span className="text-xs text-white/50 italic">
                {new Date(figurine.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent border-white/10"
                  onClick={() => handleDownload(figurine)}
                  title="Download"
                >
                  <Download size={14} />
                </Button>
                {figurine.model_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent border-white/10"
                    title="View 3D model"
                  >
                    <Eye size={14} />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default FigurineGallery;
