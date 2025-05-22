
import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PromptForm from "@/components/PromptForm";
import ImagePreview from "@/components/ImagePreview";
import ModelViewer from "@/components/ModelViewer";
import Footer from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";
import { Form } from "@/components/ui/form";

const Studio = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | "">("");
  const [showApiInput, setShowApiInput] = useState(false);
  const { toast } = useToast();

  // Format the prompt according to the style
  const formatPrompt = (userPrompt: string, style: string) => {
    let formattedPrompt = userPrompt;
    
    // Format based on style
    if (style === "isometric") {
      formattedPrompt = `${userPrompt}, RBNBICN, icon, white background, isometric perspective`;
    } else if (style === "anime") {
      formattedPrompt = `${userPrompt}, anime style, vibrant colors, white background`;
    } else if (style === "pixar") {
      formattedPrompt = `${userPrompt}, pixar style, 3D character, white background`;
    } else if (style === "steampunk") {
      formattedPrompt = `${userPrompt}, steampunk style, brass gears, vintage, white background`;
    } else if (style === "lowpoly") {
      formattedPrompt = `${userPrompt}, low poly 3D model, geometric, white background`;
    } else if (style === "cyberpunk") {
      formattedPrompt = `${userPrompt}, cyberpunk style, neon colors, futuristic, white background`;
    } else if (style === "realistic") {
      formattedPrompt = `${userPrompt}, realistic 3D render, detailed texture, white background`;
    } else if (style === "chibi") {
      formattedPrompt = `${userPrompt}, chibi style, cute, small body, big head, white background`;
    }
    
    return formattedPrompt;
  };

  // Handle API key input
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey) {
      setShowApiInput(false);
      localStorage.setItem("tempHuggingFaceApiKey", apiKey);
      toast({
        title: "API Key Saved",
        description: "Your API key has been temporarily saved for this session",
      });
    }
  };

  // Generate image using the Hugging Face API
  const handleGenerate = async (prompt: string, style: string) => {
    const savedApiKey = localStorage.getItem("tempHuggingFaceApiKey") || apiKey;
    
    if (!savedApiKey) {
      setShowApiInput(true);
      toast({
        title: "API Key Required",
        description: "Please enter your Hugging Face API key to generate images",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setModelUrl(null);
    
    const formattedPrompt = formatPrompt(prompt, style);
    
    try {
      // This is where you'd normally call a Supabase Edge Function
      // For now, we'll simulate with a direct API call
      // In production, move this to a secure Edge Function
      const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${savedApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          inputs: formattedPrompt,
          options: {
            use_lora: true,
            lora_weights: style === "isometric" ? "multimodalart/isometric-skeumorphic-3d-bnb" : undefined
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      // Convert the response to a blob and create a URL
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
      
      toast({
        title: "Image generated",
        description: `Created "${prompt}" in ${style} style`,
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Simulate 3D conversion
  const handleConvertTo3D = () => {
    setIsConverting(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, this would call another API or model
      setModelUrl("dummy-model-url");
      setIsConverting(false);
      toast({
        title: "3D model created",
        description: "Your figurine is ready to view in 3D",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-figuro-dark">
      <Header />
      
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Figuro.AI Studio</h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Design your perfect 3D figurine. Start with a text prompt, select an art style, and let our AI do the rest.
            </p>
          </motion.div>
          
          {showApiInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 rounded-xl max-w-md mx-auto mb-8"
            >
              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="text-sm text-white/70">
                    Hugging Face API Key
                  </label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    className="bg-white/5 border-white/10 text-white"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-white/50">
                    Your API key is only stored temporarily in your browser's local storage.
                    <br />
                    In production, this should be handled through a Supabase Edge Function.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-figuro-accent hover:bg-figuro-accent-hover"
                >
                  Save API Key
                </Button>
              </form>
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <PromptForm onGenerate={handleGenerate} isGenerating={isGeneratingImage} />
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
