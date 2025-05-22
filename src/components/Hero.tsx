
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import FiguroMascot from "./FiguroMascot";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 relative overflow-hidden min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-figuro-dark pointer-events-none">
        {/* Subtle gradient lines */}
        <div className="absolute left-0 right-0 bottom-0 h-1/2 bg-gradient-to-t from-figuro-dark to-transparent opacity-80" />
        <div className="absolute w-px h-[500px] bg-figuro-accent/10 rotate-12 left-[10%] top-[20%]"></div>
        <div className="absolute w-px h-[700px] bg-figuro-accent/10 -rotate-12 right-[10%] top-[10%]"></div>
      </div>
      
      <motion.div 
        className="container mx-auto px-4 relative z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="mb-6 mx-auto"
            initial={{ y: 20, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <FiguroMascot className="mx-auto" size={180} />
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Create custom 3D figurines with AI
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Generate, customize, and 3D print your own figurine designs with Figuro.AI
          </motion.p>
          
          <motion.div
            className="max-w-xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="flex rounded-md overflow-hidden bg-white/5 border border-white/10 focus-within:border-white/20">
              <Input 
                placeholder="Describe your figurine idea..."
                className="bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white/90 flex-1"
              />
              <Button className="bg-figuro-accent hover:bg-figuro-accent-hover rounded-none px-4">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-white/50 text-sm mt-3">
              Start creating custom figurines in seconds. No credit card required.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
