
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-8 text-white">
              Sign in to Figuro.AI
            </h1>
            
            <AuthForm />
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Auth;
