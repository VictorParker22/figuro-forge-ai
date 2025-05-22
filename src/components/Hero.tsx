
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-figuro-accent/5 to-transparent pointer-events-none" />
      
      <motion.div 
        className="container mx-auto px-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col items-center text-center">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gradient"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Design AI-powered Figurines,
            <br />
            <span className="text-gradient-primary">Download in 3D</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-white/70 max-w-3xl mb-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Transform your ideas into beautiful 3D figurines with just a text prompt.
            Choose from various art styles, customize your creation, and get ready-to-print 3D models.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button size="lg" className="bg-figuro-accent hover:bg-figuro-accent-hover text-white px-8 py-6">
              Start Creating
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:border-white/40 px-8 py-6">
              View Gallery
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-figuro-dark to-transparent pointer-events-none" />
    </section>
  );
};

export default Hero;
