
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const StudioHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-16"
    >
      <div className="inline-flex items-center justify-center gap-3 mb-4 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
        <Sparkles className="text-figuro-accent" size={18} />
        <span className="text-white/70">AI-Powered 3D Generation</span>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Figuro.AI Studio</h1>
      
      <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
        Design your perfect 3D figurine using our Isometric Skeuomorphic style. Start with a text prompt and let our AI do the rest.
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <span className="px-3 py-1.5 rounded-full bg-figuro-accent/20 text-figuro-accent border border-figuro-accent/30 font-medium">
          Isometric Skeuomorphic
        </span>
        <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
          Anime Style
        </span>
        <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
          Chibi
        </span>
        <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
          Low Poly
        </span>
        <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/70 border border-white/10">
          Cyberpunk
        </span>
      </div>
    </motion.div>
  );
};

export default StudioHeader;
