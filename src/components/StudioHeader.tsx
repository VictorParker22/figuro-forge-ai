
import { motion } from "framer-motion";

const StudioHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-16"
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Figuro.AI Studio</h1>
      <p className="text-lg text-white/70 max-w-2xl mx-auto mb-4">
        Design your perfect 3D figurine. Start with a text prompt, select an art style, and let our AI do the rest.
      </p>
      <p className="text-sm text-figuro-accent max-w-2xl mx-auto">
        Featured style: <span className="font-semibold">Isometric Skeuomorphic</span> - 
        Create beautiful 3D-like icons with clean lines and depth
      </p>
    </motion.div>
  );
};

export default StudioHeader;
