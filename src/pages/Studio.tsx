
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

const Studio = () => {
  const [apiKey, setApiKey] = useState<string | "">("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { toast } = useToast();
  
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
        // If there was an error but not related to API key
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate image. Please try again.",
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

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <StudioHeader />
          
          <div className="mb-8 flex justify-between items-center">
            <Button 
              onClick={() => setUploadModalOpen(true)}
              variant="outline" 
              className="border-white/10 hover:border-white/30"
            >
              <Upload size={16} className="mr-2" />
              Upload 3D Model
            </Button>
            
            <div className="flex items-center gap-4">
              {authUser ? (
                <div className="flex items-center gap-4">
                  <span className="text-white">Welcome, {authUser.email}</span>
                  <Button onClick={handleSignOut} variant="outline" className="border-white/10">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button onClick={handleSignIn} variant="outline" className="border-white/10">
                  Sign In to Save
                </Button>
              )}
            </div>
          </div>
          
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <PromptForm 
                onGenerate={onGenerate} 
                isGenerating={isGeneratingImage}
              />
            </div>
            
            <div>
              <ImagePreview 
                imageSrc={generatedImage} 
                isLoading={isGeneratingImage}
                onConvertTo3D={handleConvertWithUsageTracking}
                isConverting={isConverting}
                generationMethod={generationMethod}
              />
            </div>
            
            <div>
              <ModelViewer 
                modelUrl={displayModelUrl} 
                isLoading={isConverting}
                progress={conversionProgress}
                errorMessage={conversionError}
                onCustomModelLoad={handleCustomModelLoad}
              />
            </div>
          </div>
          
          {authUser && (
            <div className="mt-16">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gradient">Your Figurine Collection</h2>
              </div>
              <FigurineGallery />
            </div>
          )}

          {/* Upload Model Modal */}
          <UploadModelModal 
            isOpen={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            onModelUpload={handleModelUpload}
          />
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Studio;
