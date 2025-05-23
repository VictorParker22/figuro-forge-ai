
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { cleanupAuthState } from "@/utils/authUtils";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Clean up auth state when mounting the auth page
  useEffect(() => {
    // Clean up any orphaned auth state when landing on auth page
    cleanupAuthState();
  }, []);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-6 text-white">
              Sign in to Figuro.AI
            </h1>
            
            <div className="mb-6 w-full max-w-md">
              <Alert className="bg-figuro-accent/10 border-figuro-accent/20">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You'll need to verify your email address before signing in.
                </AlertDescription>
              </Alert>
            </div>
            
            <AuthForm />
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Auth;
