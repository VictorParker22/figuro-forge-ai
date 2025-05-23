
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { user, profile, isLoading } = useAuth();
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
            className="max-w-4xl mx-auto"
          >
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-white/70">Manage your account preferences and settings</p>
            </div>
            
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-3 max-w-[600px]">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account" className="mt-8 space-y-6">
                <Card className="bg-figuro-darker/50 border-white/10">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-white/70 mb-1">Email</p>
                        <p className="text-white">{user?.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-white/70 mb-1">Current Plan</p>
                        <p className="text-white">{profile?.plan || "Free"}</p>
                        
                        <Button 
                          variant="outline" 
                          className="mt-2" 
                          onClick={() => navigate("/pricing")}
                        >
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-figuro-darker/50 border-white/10">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Password</h2>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Password reset email sent",
                          description: "Please check your email to reset your password.",
                        });
                      }}
                    >
                      Reset Password
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-figuro-darker/50 border-white/10">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Danger Zone</h2>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        toast({
                          title: "Account cannot be deleted",
                          description: "Please contact support to delete your account.",
                          variant: "destructive",
                        });
                      }}
                    >
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-8">
                <Card className="bg-figuro-darker/50 border-white/10">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Email Notifications</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="marketing-emails" />
                        <Label htmlFor="marketing-emails" className="text-white">
                          Marketing emails
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="account-updates" defaultChecked />
                        <Label htmlFor="account-updates" className="text-white">
                          Account updates
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="figurine-complete" defaultChecked />
                        <Label htmlFor="figurine-complete" className="text-white">
                          Figurine generation complete
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance" className="mt-8">
                <Card className="bg-figuro-darker/50 border-white/10">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Theme</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="dark-mode" defaultChecked disabled />
                        <Label htmlFor="dark-mode" className="text-white">
                          Dark mode
                        </Label>
                      </div>
                      
                      <p className="text-white/50 text-sm">
                        Light mode coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Settings;
