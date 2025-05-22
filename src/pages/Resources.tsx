
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Resources = () => {
  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Resources</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Helpful guides, tutorials, and documentation to get the most out of Figuro.AI.
            </p>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Resources;
