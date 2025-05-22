
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import PromptForm from "@/components/PromptForm";
import ImagePreview from "@/components/ImagePreview";
import ModelViewer from "@/components/ModelViewer";
import Footer from "@/components/Footer";
import ApiKeyInput from "@/components/ApiKeyInput";
import StudioHeader from "@/components/StudioHeader";
import FigurineGallery from "@/components/FigurineGallery";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Studio = () => {
  const [apiKey, setApiKey] = useState<string | "">("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
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
  const handleCustomModelLoad = (url: string) => {
    setCustomModelUrl(url);
    toast({
      title: "Custom model loaded",
      description: "Your custom 3D model has been loaded successfully",
    });
  };

  // Call directly to handleGenerate instead of trying edge function first
  const onGenerate = async (prompt: string, style: string) => {
    // Reset custom model when generating a new image
    setCustomModelUrl(null);
    
    // Call the handleGenerate function directly
    const result = await handleGenerate(prompt, style, apiKey);
    
    if (result.needsApiKey) {
      setShowApiInput(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const handleSignIn = () => {
    // In a real app, redirect to the login page
    toast({
      title: "Authentication required",
      description: "Please sign in to save your figurines",
    });
    // For now, we'll just show a toast
    // window.location.href = "/login";
  };

  // Determine which model URL to display - custom or generated
  const displayModelUrl = customModelUrl || modelUrl;

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <StudioHeader />
          
          <div className="mb-8 flex justify-end">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-white">Welcome, {user.email}</span>
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
          
          {showApiInput && (
            <ApiKeyInput 
              apiKey={apiKey}
              setApiKey={setApiKey}
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
                onConvertTo3D={handleConvertTo3D}
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
          
          {user && (
            <div className="mt-16">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gradient">Your Figurine Collection</h2>
              </div>
              <FigurineGallery />
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Studio;

