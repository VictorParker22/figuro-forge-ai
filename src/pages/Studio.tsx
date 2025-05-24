import { useState, useEffect } from "react";
import Header from "@/components/Header";
import PromptForm from "@/components/PromptForm";
import ImagePreview from "@/components/ImagePreview";
import ModelViewer from "@/components/model-viewer";
import Footer from "@/components/Footer";
import ApiKeyInput from "@/components/ApiKeyInput";
import StudioHeader from "@/components/StudioHeader";
import { FigurineGallery } from "@/components/figurine";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import UploadModelModal from "@/components/UploadModelModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VantaBackground from "@/components/VantaBackground";
import { motion } from "framer-motion";

const Studio = () => {
  const [apiKey, setApiKey] = useState<string | "">("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  
  const {
    isGeneratingImage,
    isConverting,
    generatedImage,
    modelUrl,
    handleGenerate,
    handleConvertTo3D,
    requiresApiKey,
    generationMethod,
    conversionProgress,
    conversionError
  } = useImageGeneration();

  const { user: authUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { canPerformAction, trackAction } = useUsageTracking();

  // Check for authenticated user
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user || null);
        }
      );
      
      return () => subscription.unsubscribe();
    };
    
    checkUser();
  }, []);

  useEffect(() => {
    // Check if API key is stored in localStorage
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    // Show API input if requiresApiKey is true
    setShowApiInput(requiresApiKey);
  }, [requiresApiKey]);

  // When a custom model is loaded, reset any conversion process
  const handleCustomModelLoad = (url: string, file: File) => {
    setCustomModelUrl(url);
    setCustomModelFile(file);
    toast({
      title: "Custom model loaded",
      description: "Your custom 3D model has been loaded successfully",
    });
  };

  // Call directly to handleGenerate instead of trying edge function first
  const onGenerate = async (prompt: string, style: string) => {
    // Reset custom model when generating a new image
    setCustomModelUrl(null);
    setCustomModelFile(null);
    
    // Check if user can perform action
    if (!authUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate images",
      });
      navigate("/auth");
      return;
    }
    
    const canGenerate = canPerformAction("image_generation");
    if (!canGenerate) {
      // Show upgrade modal
      setShowApiInput(false); // Hide API input if shown
      toast({
        title: "Usage limit reached",
        description: "You've reached your monthly image generation limit",
        variant: "destructive",
      });
      // Show upgrade modal with appropriate settings
      // ... your existing modal code
      return;
    }
    
    // Track usage
    const tracked = await trackAction("image_generation");
    if (!tracked) {
      return;
    }
    
    // Call the handleGenerate function with improved error handling
    try {
      const result = await handleGenerate(prompt, style, apiKey);
      
      if (result.needsApiKey) {
        setShowApiInput(true);
        toast({
          title: "API Key Required",
          description: "Please enter your Hugging Face API key to continue",
        });
      } else if (!result.success) {
        // The error property doesn't exist on the result type, so use a generic message
        toast({
          title: "Generation Failed",
          description: "Failed to generate image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in image generation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Handle model conversion with usage tracking
  const handleConvertWithUsageTracking = async () => {
    if (!generatedImage) {
      return;
    }
    
    if (!authUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to convert models",
      });
      navigate("/auth");
      return;
    }
    
    const canConvert = canPerformAction("model_conversion");
    if (!canConvert) {
      toast({
        title: "Usage limit reached",
        description: "You've reached your monthly model conversion limit",
        variant: "destructive",
      });
      // Show upgrade modal with appropriate settings
      // ... your existing modal code
      return;
    }
    
    // Track usage
    const tracked = await trackAction("model_conversion");
    if (!tracked) {
      return;
    }
    
    // Call the original conversion function
    await handleConvertTo3D();
  };

  // Handle model upload from modal
  const handleModelUpload = (url: string, file: File) => {
    setCustomModelUrl(url);
    setCustomModelFile(file);
    toast({
      title: "Model uploaded",
      description: `${file.name} has been loaded successfully`,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  // Determine which model URL to display - custom or generated
  const displayModelUrl = customModelUrl || modelUrl;
  const displayModelFile = customModelFile;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-figuro-dark overflow-hidden relative">
      <VantaBackground>
        <Header />
        
        <section className="pt-20 pb-24">
          <div className="container mx-auto px-4">
            <StudioHeader />
            
            <motion.div 
              className="mb-8 flex justify-between items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button 
                onClick={() => setUploadModalOpen(true)}
                variant="outline" 
                className="border-white/20 hover:border-white/40 bg-white/5 backdrop-blur-sm"
              >
                <Upload size={16} className="mr-2" />
                Upload 3D Model
              </Button>
              
              <div className="flex items-center gap-4">
                {authUser ? (
                  <div className="flex items-center gap-4">
                    <span className="text-white">Welcome, {authUser.email}</span>
                    <Button onClick={handleSignOut} variant="outline" className="border-white/20 bg-white/5 backdrop-blur-sm">
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleSignIn} variant="outline" className="border-white/20 bg-white/5 backdrop-blur-sm">
                    Sign In to Save
                  </Button>
                )}
              </div>
            </motion.div>
            
            {showApiInput && (
              <ApiKeyInput 
                apiKey={apiKey}
                setApiKey={(key) => {
                  setApiKey(key);
                  localStorage.setItem("tempHuggingFaceApiKey", key);
                }}
                onSubmit={() => setShowApiInput(false)}
              />
            )}
            
            <Tabs 
              defaultValue="create" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full mb-8"
            >
              <TabsList className="grid grid-cols-2 w-[400px] mx-auto bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="create" className="data-[state=active]:text-white data-[state=active]:bg-figuro-accent">
                  Create Model
                </TabsTrigger>
                <TabsTrigger value="gallery" className="data-[state=active]:text-white data-[state=active]:bg-figuro-accent">
                  Your Gallery
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="mt-6">
                <motion.div 
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div variants={item}>
                    <PromptForm 
                      onGenerate={onGenerate} 
                      isGenerating={isGeneratingImage}
                    />
                  </motion.div>
                  
                  <motion.div variants={item}>
                    <ImagePreview 
                      imageSrc={generatedImage} 
                      isLoading={isGeneratingImage}
                      onConvertTo3D={handleConvertWithUsageTracking}
                      isConverting={isConverting}
                      generationMethod={generationMethod}
                    />
                  </motion.div>
                  
                  <motion.div variants={item}>
                    <ModelViewer 
                      modelUrl={displayModelUrl} 
                      isLoading={isConverting}
                      progress={conversionProgress}
                      errorMessage={conversionError}
                      onCustomModelLoad={handleCustomModelLoad}
                    />
                  </motion.div>
                </motion.div>
              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                {authUser ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-gradient">Your Figurine Collection</h2>
                    </div>
                    <FigurineGallery />
                  </motion.div>
                ) : (
                  <div className="text-center py-16 glass-panel rounded-xl">
                    <h2 className="text-2xl font-semibold text-gradient mb-4">Sign in to view your gallery</h2>
                    <p className="text-white/70 mb-6">Create an account to save and manage your figurines</p>
                    <Button onClick={handleSignIn} className="bg-figuro-accent hover:bg-figuro-accent-hover">
                      Sign In / Sign Up
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
        
        <Footer />
      </VantaBackground>

      {/* Upload Model Modal */}
      <UploadModelModal 
        isOpen={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onModelUpload={handleModelUpload}
      />
    </div>
  );
};

export default Studio;
