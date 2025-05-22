
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import PromptForm from "@/components/PromptForm";
import ImagePreview from "@/components/ImagePreview";
import ModelViewer from "@/components/ModelViewer";
import Footer from "@/components/Footer";
import ApiKeyInput from "@/components/ApiKeyInput";
import StudioHeader from "@/components/StudioHeader";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { generateImageWithEdge } from "@/lib/edgeFunction";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Studio = () => {
  const [apiKey, setApiKey] = useState<string | "">("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  
  const {
    isGeneratingImage,
    isConverting,
    generatedImage,
    modelUrl,
    handleGenerate,
    handleConvertTo3D,
    requiresApiKey
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

  // Wrapper for generate function to handle API key checking
  const onGenerate = async (prompt: string, style: string) => {
    try {
      // First try to use the edge function
      const edgeResult = await generateImageWithEdge({
        prompt,
        style,
        apiKey: apiKey || undefined
      });
      
      if (edgeResult.success && edgeResult.imageUrl) {
        // Handle successful edge generation
        toast({
          title: "Image generated",
          description: `Created "${prompt}" in ${style} style`,
        });
      } else {
        // Fall back to the regular generation method
        const result = await handleGenerate(prompt, style, apiKey);
        if (result.needsApiKey) {
          setShowApiInput(true);
        }
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
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
              <PromptForm onGenerate={onGenerate} isGenerating={isGeneratingImage} />
            </div>
            
            <div>
              <ImagePreview 
                imageSrc={generatedImage} 
                isLoading={isGeneratingImage}
                onConvertTo3D={handleConvertTo3D}
                isConverting={isConverting}
              />
            </div>
            
            <div>
              <ModelViewer modelUrl={modelUrl} isLoading={isConverting} />
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Studio;
