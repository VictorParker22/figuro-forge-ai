
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CompleteProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const success = searchParams.get("success");
  
  // If this is a successful Stripe redirect, show success message
  useEffect(() => {
    if (success === "true") {
      toast({
        title: "Subscription activated!",
        description: "Your plan has been activated successfully.",
      });
    }
  }, [success]);
  
  useEffect(() => {
    // If no user, redirect to login
    if (!user && !isLoading) {
      navigate("/auth");
    }
  }, [user, navigate, isLoading]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Update the user profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Redirect to home page
      navigate("/");
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-8 text-white">
              Complete Your Profile
            </h1>
            
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                  Please provide the following information to complete your profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      id="full-name"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => navigate("/")}>
                  Skip for now
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default CompleteProfile;
