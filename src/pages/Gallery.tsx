
import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Gallery = () => {
  const [category, setCategory] = useState("all");
  
  // Placeholder gallery items
  const galleryItems = [
    {
      id: 1,
      title: "Fantasy Warrior",
      creator: "AI Studio",
      imageUrl: "https://images.unsplash.com/photo-1637140945341-f28ada987326",
      category: "fantasy"
    },
    {
      id: 2,
      title: "Sci-Fi Explorer",
      creator: "AI Studio",
      imageUrl: "https://images.unsplash.com/photo-1637140945341-f28ada987326",
      category: "sci-fi"
    },
    {
      id: 3,
      title: "Anime Hero",
      creator: "AI Studio",
      imageUrl: "https://images.unsplash.com/photo-1637140945341-f28ada987326",
      category: "anime"
    },
    {
      id: 4,
      title: "Cartoon Character",
      creator: "AI Studio",
      imageUrl: "https://images.unsplash.com/photo-1637140945341-f28ada987326",
      category: "cartoon"
    },
    {
      id: 5,
      title: "Mythical Creature",
      creator: "AI Studio",
      imageUrl: "https://images.unsplash.com/photo-1637140945341-f28ada987326",
      category: "fantasy"
    },
    {
      id: 6,
      title: "Space Traveler",
      creator: "AI Studio",
      imageUrl: "https://images.unsplash.com/photo-1637140945341-f28ada987326",
      category: "sci-fi"
    },
  ];
  
  const filteredItems = category === "all" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === category);

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
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gradient">Gallery</h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Explore stunning 3D figurines created with Figuro.AI. Get inspired and see what's possible.
            </p>
          </motion.div>
          
          <Tabs defaultValue="all" value={category} onValueChange={setCategory} className="max-w-4xl mx-auto mb-12">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-white/5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="fantasy">Fantasy</TabsTrigger>
                <TabsTrigger value="sci-fi">Sci-Fi</TabsTrigger>
                <TabsTrigger value="anime">Anime</TabsTrigger>
                <TabsTrigger value="cartoon">Cartoon</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={category}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-panel rounded-lg overflow-hidden group"
                  >
                    <div className="aspect-square relative overflow-hidden bg-white/5">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <div className="p-4 w-full">
                          <Button className="w-full bg-figuro-accent hover:bg-figuro-accent-hover">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-white/60">by {item.creator}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
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
            <Button className="bg-figuro-accent hover:bg-figuro-accent-hover text-white px-8 py-6 text-lg">
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
