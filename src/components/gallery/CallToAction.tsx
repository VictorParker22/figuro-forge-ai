
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CallToActionProps {
  onNavigateToStudio: () => void;
}

const CallToAction: React.FC<CallToActionProps> = ({ onNavigateToStudio }) => {
  return (
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
            onClick={onNavigateToStudio}
          >
            Launch Studio
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
