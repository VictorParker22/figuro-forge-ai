
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublicFigurines } from "@/services/figurineService";
import { Figurine } from "@/types/figurine";
import { useNavigate } from "react-router-dom";
import { Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Extend the Figurine type with the display URL
interface GalleryFigurine extends Figurine {
  display_url?: string;
}

const Gallery = () => {
  const [category, setCategory] = useState("all");
  const [figurines, setFigurines] = useState<GalleryFigurine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Load initial figurines
  useEffect(() => {
    const loadFigurines = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPublicFigurines();
        setFigurines(data);
      } catch (error) {
        console.error("Error loading figurines:", error);
        toast({
          title: "Error loading gallery",
          description: "Could not load the gallery items. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFigurines();
  }, [toast]);
  
  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('public-figurines')
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'figurines', filter: 'is_public=eq.true' }, 
          async payload => {
            // Process the new figurine to get storage URL
            const newFigurine = payload.new as GalleryFigurine;
            
            // Get signed URL if we have a saved_image_url
            if (newFigurine.saved_image_url) {
              try {
                // Extract the path from the storage URL
                const urlParts = newFigurine.saved_image_url.split('/');
                const bucketName = 'figurine-images';
                const filePath = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];
                
                // Get a signed URL that doesn't expire for 60 minutes
                const { data: signedUrlData } = await supabase.storage
                  .from(bucketName)
                  .createSignedUrl(filePath, 3600);
                  
                if (signedUrlData?.signedUrl) {
                  newFigurine.display_url = signedUrlData.signedUrl;
                }
              } catch (err) {
                console.error('Error getting signed URL:', err);
                // Fallback to the original image_url
                newFigurine.display_url = newFigurine.image_url;
              }
            } else {
              // Use the original image_url as fallback
              newFigurine.display_url = newFigurine.image_url;
            }
            
            // Add the new figurine to the state
            setFigurines(prevFigurines => [newFigurine, ...prevFigurines]);
            
            // Show a toast notification
            toast({
              title: "New figurine created!",
              description: `Someone just created "${newFigurine.title || 'a new figurine'}"`,
            });
          }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
  
  const handleNavigateToStudio = () => {
    navigate('/studio');
  };
  
  const handleDownload = (figurine: GalleryFigurine) => {
    const imageUrl = figurine.display_url || figurine.saved_image_url || figurine.image_url;
    if (!imageUrl) return;
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `figurine-${figurine.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleView3DModel = (figurine: GalleryFigurine) => {
    // Open the 3D model viewer in a new tab or modal
    if (figurine.model_url) {
      window.open(figurine.model_url, '_blank');
    }
  };
  
  // Filter figurines by style category if selected
  const filteredFigurines = category === "all" 
    ? figurines 
    : figurines.filter(item => item.style === category);

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gradient">Community Gallery</h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              See figurines created by the community in real-time. Every new creation appears here instantly!
            </p>
          </motion.div>
          
          <Tabs defaultValue="all" value={category} onValueChange={setCategory} className="max-w-6xl mx-auto mb-12">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-white/5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="isometric">Isometric</TabsTrigger>
                <TabsTrigger value="anime">Anime</TabsTrigger>
                <TabsTrigger value="pixar">Pixar</TabsTrigger>
                <TabsTrigger value="steampunk">Steampunk</TabsTrigger>
                <TabsTrigger value="lowpoly">Low Poly</TabsTrigger>
                <TabsTrigger value="cyberpunk">Cyberpunk</TabsTrigger>
                <TabsTrigger value="realistic">Realistic</TabsTrigger>
                <TabsTrigger value="chibi">Chibi</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={category}>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <Card key={item} className="glass-panel">
                      <CardHeader className="p-3 border-b border-white/10">
                        <Skeleton className="h-6 w-2/3 bg-white/5" />
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="aspect-square w-full">
                          <Skeleton className="h-full w-full bg-white/5 loading-shine" />
                        </div>
                      </CardContent>
                      <CardFooter className="p-3">
                        <Skeleton className="h-4 w-1/2 bg-white/5" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredFigurines.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFigurines.map((figurine, index) => (
                    <motion.div 
                      key={figurine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="glass-panel rounded-lg overflow-hidden group"
                    >
                      <div className="p-3 border-b border-white/10 flex justify-between items-center">
                        <h3 className="font-medium text-white truncate">{figurine.title || "Untitled"}</h3>
                        <Badge variant="outline" className="text-xs border-white/20">{figurine.style}</Badge>
                      </div>
                      <div className="aspect-square relative overflow-hidden bg-white/5">
                        <img 
                          src={figurine.display_url || figurine.saved_image_url || figurine.image_url} 
                          alt={figurine.title || "Figurine"} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="p-4 w-full">
                            <Button 
                              onClick={() => handleDownload(figurine)}
                              className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
                            >
                              <Download size={16} className="mr-2" /> Download
                            </Button>
                            {figurine.model_url && (
                              <Button 
                                onClick={() => handleView3DModel(figurine)}
                                className="w-full mt-2 bg-transparent border border-white/20 hover:bg-white/10"
                              >
                                <Eye size={16} className="mr-2" /> View 3D Model
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <p className="text-sm text-white/60 truncate max-w-[70%]">
                          {figurine.prompt.substring(0, 30)}{figurine.prompt.length > 30 ? "..." : ""}
                        </p>
                        <span className="text-xs text-white/40">
                          {new Date(figurine.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-white/70 mb-4">No figurines found in this category yet.</p>
                  <p className="text-white/50 mb-8">Be the first to create one!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <section className="py-16 bg-gradient-to-b from-transparent to-figuro-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gradient">
              Ready to create your own figurine?
            </h2>
            <Button 
              className="bg-figuro-accent hover:bg-figuro-accent-hover text-white px-8 py-6 text-lg"
              onClick={handleNavigateToStudio}
            >
              Launch Studio
            </Button>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Gallery;
