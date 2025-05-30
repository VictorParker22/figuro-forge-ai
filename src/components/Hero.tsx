
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/studio');
  };
  
  return (
    <section className="pt-32 pb-20 relative overflow-hidden min-h-screen flex items-center justify-center">
      <motion.div 
        className="container mx-auto px-4 relative z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Transform Your Ideas Into Physical Art
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Figuro.AI turns your imagination into stunning 3D figurines with just a text prompt. Design, customize, and bring your creations to life.
          </motion.p>
          
          <motion.div
            className="max-w-xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="flex rounded-md overflow-hidden bg-white/5 border border-white/10 focus-within:border-white/20">
                <Input 
                  placeholder="Describe your dream figurine..."
                  className="bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white/90 flex-1"
                />
                <Button type="submit" className="bg-figuro-accent hover:bg-figuro-accent-hover rounded-none px-4">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </form>
            <p className="text-white/50 text-sm mt-3">
              From concept to collectible in minutes. No design skills needed.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
