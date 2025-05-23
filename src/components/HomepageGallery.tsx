
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchPublicFigurines } from "@/services/figurineService";
import { Figurine } from "@/types/figurine";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Image, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const HomepageGallery: React.FC = () => {
  const [figurines, setFigurines] = useState<Figurine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFigurines = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPublicFigurines();
        // Limit to 10 items
        setFigurines(data.slice(0, 10));
      } catch (error) {
        console.error("Error loading figurines:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFigurines();
  }, []);

  const navigateToGallery = () => {
    navigate("/gallery");
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          className="flex flex-col items-center mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gradient">
            Latest Creations
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Explore the latest figurines created by our community. Get inspired and start creating your own unique designs.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {Array(10).fill(0).map((_, index) => (
              <div key={index} className="glass-panel h-48 md:h-40">
                <Skeleton className="h-full w-full bg-white/5 loading-shine" />
              </div>
            ))}
          </div>
        ) : figurines.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {figurines.map((figurine, index) => (
                <motion.div
                  key={figurine.id}
                  className="glass-panel overflow-hidden aspect-square relative group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <div className="w-full h-full">
                    <img
                      src={figurine.saved_image_url || figurine.image_url}
                      alt={figurine.title || "Figurine"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-3 w-full">
                      <p className="text-xs text-white/90 truncate font-medium mb-1">
                        {figurine.title || "Untitled Figurine"}
                      </p>
                      <div className="flex items-center gap-1">
                        {figurine.model_url ? (
                          <Box size={12} className="text-figuro-accent" />
                        ) : (
                          <Image size={12} className="text-white/70" />
                        )}
                        <span className="text-xs text-white/70">
                          {figurine.model_url ? "3D Model" : "Image"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <Button
                onClick={navigateToGallery}
                className="bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
              >
                View Full Gallery <ArrowRight size={16} />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/70">No figurines found.</p>
            <Button
              onClick={() => navigate("/studio")}
              className="mt-4 bg-figuro-accent hover:bg-figuro-accent-hover"
            >
              Create Your First Figurine
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomepageGallery;
