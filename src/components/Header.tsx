
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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
          <Link to="/">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-figuro-accent font-bold text-2xl">Figuro</span>
              <span className="text-white font-bold text-2xl">.AI</span>
            </motion.div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/features" className="text-sm text-white/70 hover:text-white transition-colors">
            Features
          </Link>
          <Link to="/gallery" className="text-sm text-white/70 hover:text-white transition-colors">
            Gallery
          </Link>
          <Link to="/pricing" className="text-sm text-white/70 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link to="/docs" className="text-sm text-white/70 hover:text-white transition-colors">
            Docs
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-sm hidden md:inline-flex">
            Sign In
          </Button>
          <Link to="/studio">
            <Button className="bg-figuro-accent text-white hover:bg-figuro-accent-hover">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
