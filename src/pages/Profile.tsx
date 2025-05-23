
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import FigurineGallery from "@/components/figurine/FigurineGallery";

const Profile = () => {
  const { user, profile, isLoading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const navigate = useNavigate();
  
  useEffect(() => {
    // If authentication is complete (not loading) and user is not authenticated, redirect to auth page
    if (!isLoading && !user) {
      navigate("/auth");
    }
    
    // Set initial form values when profile data loads
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [isLoading, user, profile, navigate]);
  
  // Generate initials for avatar fallback
  const getInitials = () => {
    if (fullName) {
      return fullName.split(" ").map(name => name[0]).join("").toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "FG";
  };
  
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAvatarFile(e.target.files[0]);
      // Create a preview URL for the selected file
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      let newAvatarUrl = avatarUrl;
      
      // If user has selected a new avatar file, upload it to Supabase storage
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
        
        // Check if avatars bucket exists, if not we'll get an error
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL for the uploaded file
        const { data: urlData } = await supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        if (urlData) {
          newAvatarUrl = urlData.publicUrl;
        }
      }
      
      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
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
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-figuro-accent shadow-glow">
                  <AvatarImage 
                    src={avatarUrl || `https://www.gravatar.com/avatar/${user?.email ? user.email.trim().toLowerCase() : ''}?d=mp&s=256`} 
                    alt={fullName || user?.email || "User"} 
                  />
                  <AvatarFallback className="bg-figuro-accent text-white text-4xl">{getInitials()}</AvatarFallback>
                </Avatar>
                
                {activeTab === "edit" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <label htmlFor="avatar-upload" className="cursor-pointer p-2 rounded-full bg-figuro-accent hover:bg-figuro-accent-hover">
                      <Upload className="h-6 w-6 text-white" />
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">{profile?.full_name || user?.email}</h1>
                <p className="text-white/70">{user?.email}</p>
                <p className="text-white/50 mt-1">Member since {formatDate(user?.created_at)}</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 max-w-[400px] mx-auto">
                <TabsTrigger value="info">Profile Info</TabsTrigger>
                <TabsTrigger value="edit">Edit Profile</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-8">
                <Card className="bg-figuro-darker/50 border-white/10">
                  <CardContent className="pt-6">
                    <div className="space-y-4 text-white">
                      <div>
                        <h2 className="text-lg font-semibold mb-1">Full Name</h2>
                        <p className="text-white/70">{profile?.full_name || "Not set"}</p>
                      </div>
                      
                      <div>
                        <h2 className="text-lg font-semibold mb-1">Email Address</h2>
                        <p className="text-white/70">{user?.email}</p>
                      </div>
                      
                      <div>
                        <h2 className="text-lg font-semibold mb-1">Account Created</h2>
                        <p className="text-white/70">{formatDate(user?.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <h2 className="text-2xl font-bold text-white mt-12 mb-6">My Figurines</h2>
                <FigurineGallery />
              </TabsContent>
              
              <TabsContent value="edit" className="mt-8">
                <Card className="bg-figuro-darker/50 border-white/10">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label htmlFor="fullName" className="text-sm font-medium text-white block mb-2">
                        Full Name
                      </label>
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-figuro-dark border-white/20 text-white"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-white block mb-2">
                        Email Address
                      </label>
                      <Input 
                        value={user?.email || ""} 
                        disabled
                        className="bg-figuro-dark border-white/20 text-white/50"
                      />
                      <p className="mt-1 text-xs text-white/50">Email cannot be changed</p>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        onClick={handleProfileUpdate} 
                        disabled={isUpdating}
                        className="bg-figuro-accent hover:bg-figuro-accent-hover"
                      >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
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

export default Profile;
