
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b border-white/10 backdrop-blur-md fixed w-full z-50"
    >
      <div className="container mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className="text-figuro-accent font-bold text-2xl">Figuro</span>
            <span className="text-white font-bold text-2xl">.AI</span>
          </motion.div>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
            Features
          </a>
          <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
            Gallery
          </a>
          <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
            Pricing
          </a>
          <a href="#" className="text-sm text-white/70 hover:text-white transition-colors">
            Docs
          </a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm hidden md:inline-flex">
            Sign In
          </Button>
          <Button className="bg-figuro-accent text-white hover:bg-figuro-accent-hover">
            Get Started
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
