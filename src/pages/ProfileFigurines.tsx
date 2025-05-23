
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import FigurineGallery from "@/components/figurine/FigurineGallery";
import { Loader2 } from "lucide-react";

const ProfileFigurines = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If authentication is complete (not loading) and user is not authenticated, redirect to auth page
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);
  
  // If still loading or no user, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-figuro-dark">
        <Header />
        <div className="container mx-auto pt-32 pb-24 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-figuro-accent" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-white mb-4">My Figurines</h1>
              <p className="text-white/70">View and manage all your created figurines.</p>
            </div>
            
            <FigurineGallery />
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default ProfileFigurines;
