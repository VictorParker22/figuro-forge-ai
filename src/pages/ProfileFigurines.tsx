
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import FigurineGallery from "@/components/figurine/FigurineGallery";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ProfileFigurines = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // If authentication is complete (not loading) and user is not authenticated, redirect to auth page
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [isLoading, user, navigate]);

  const handleCreateNew = () => {
    navigate("/studio");
    toast({
      title: "Create New Figurine",
      description: "Let's make something awesome!"
    });
  };
  
  // If still loading or no user, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-figuro-dark">
        <Header />
        <div className="container mx-auto pt-32 pb-24 flex justify-center items-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-figuro-accent" />
            <p className="text-white/70">Loading your profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If no user after loading, redirect will happen in useEffect
  if (!user) {
    return (
      <div className="min-h-screen bg-figuro-dark">
        <Header />
        <div className="container mx-auto pt-32 pb-24 flex justify-center items-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/70">Please sign in to view your figurines</p>
            <Button 
              onClick={() => navigate("/auth")}
              variant="default"
              className="bg-figuro-accent hover:bg-figuro-accent-hover"
            >
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-10 flex flex-wrap justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">My Figurines</h1>
                <p className="text-white/70">View and manage all your created figurines.</p>
              </div>
              
              <Button 
                onClick={handleCreateNew}
                className="mt-4 md:mt-0 bg-figuro-accent hover:bg-figuro-accent-hover"
              >
                Create New Figurine
              </Button>
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
