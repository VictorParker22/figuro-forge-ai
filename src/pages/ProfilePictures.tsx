
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";

const ProfilePictures = () => {
  const { user, profile, isLoading } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    // If authentication is complete (not loading) and user is not authenticated, redirect to auth page
    if (!isLoading && !user) {
      navigate("/auth");
    }
    
    // Set initial avatar URL when profile data loads
    if (profile) {
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [isLoading, user, profile, navigate]);
  
  // Generate initials for avatar fallback
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ").map(name => name[0]).join("").toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "FG";
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      handleAvatarUpload(file);
    }
  });

  const handleAvatarUpload = async (file) => {
    if (!user) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      if (urlData) {
        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: urlData.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (updateError) {
          throw updateError;
        }
        
        // Update local state
        setAvatarUrl(urlData.publicUrl);
        
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        });
      }
      
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading your avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveAvatar = async () => {
    if (!user) return;
    
    try {
      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setAvatarUrl("");
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
      
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while removing your avatar.",
        variant: "destructive",
      });
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
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-white mb-2">Profile Pictures</h1>
              <p className="text-white/70">Upload and manage your profile picture</p>
            </div>
            
            <Card className="bg-figuro-darker/50 border-white/10">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <Avatar className="h-40 w-40 border-4 border-figuro-accent shadow-glow">
                      <AvatarImage 
                        src={avatarUrl || `https://www.gravatar.com/avatar/${user?.email ? user.email.trim().toLowerCase() : ''}?d=mp&s=256`} 
                        alt={profile?.full_name || user?.email || "User"} 
                      />
                      <AvatarFallback className="bg-figuro-accent text-white text-5xl">{getInitials()}</AvatarFallback>
                    </Avatar>
                    
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="h-10 w-10 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-2">Current Profile Picture</h2>
                      <p className="text-white/70">
                        {avatarUrl 
                          ? "You currently have a custom profile picture." 
                          : "You're using a default profile picture. Upload a custom one below."}
                      </p>
                    </div>
                    
                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                        isDragActive 
                          ? "border-figuro-accent bg-figuro-accent/10" 
                          : "border-white/20 hover:border-white/40"
                      )}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-10 w-10 mx-auto mb-4 text-white/70" />
                      <p className="text-white font-medium">
                        {isDragActive 
                          ? "Drop your image here..." 
                          : "Drag and drop your image here, or click to select"}
                      </p>
                      <p className="text-white/50 text-sm mt-2">
                        Supports JPG, PNG or GIF (max 5MB)
                      </p>
                    </div>
                    
                    {avatarUrl && (
                      <Button 
                        variant="destructive" 
                        className="mt-4"
                        onClick={handleRemoveAvatar}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Profile Picture
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => navigate("/profile")}>
                Back to Profile
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default ProfilePictures;
