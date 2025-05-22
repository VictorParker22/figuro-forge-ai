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
import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
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
      // First try to use the edge function with server-side token
      const response = await fetch(`${window.location.origin}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY || ''}`
        },
        body: JSON.stringify({ 
          prompt,
          style,
          apiKey: apiKey || undefined
        }),
      });
      
      // If the server requires an API key or if there's an auth error
      if (response.status === 401) {
        const errorData = await response.json();
        console.log("API key required:", errorData);
        setShowApiInput(true);
        return;
      }
      
      if (!response.ok) {
        // Check if it's a JSON response with error details
        const contentType = response.headers.get("Content-Type") || "";
        if (contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.statusText}`);
        }
        throw new Error(`API error: ${response.statusText}`);
      }
      
      // Process the response - handle both binary image data and JSON
      const contentType = response.headers.get("Content-Type") || "";
      
      if (contentType.includes("image/")) {
        // It's an image, create a blob URL
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        // Call the handleGenerate function to update the UI state
        // This avoids duplicate code and ensures the image is saved to Supabase if user is logged in
        await handleGenerate(prompt, style, apiKey, imageUrl);
        
        toast({
          title: "Image generated",
          description: `Created "${prompt}" in ${style} style`,
        });
      } else if (contentType.includes("application/json")) {
        // It's JSON, likely an error
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to generate image");
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      
      // Fall back to the direct generation method
      const result = await handleGenerate(prompt, style, apiKey);
      
      if (result.needsApiKey) {
        setShowApiInput(true);
      } else {
        toast({
          title: "Generation failed",
          description: error instanceof Error ? error.message : "Failed to generate image",
          variant: "destructive",
        });
      }
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
              />
            </div>
            
            <div>
              <ModelViewer modelUrl={modelUrl} isLoading={isConverting} />
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
