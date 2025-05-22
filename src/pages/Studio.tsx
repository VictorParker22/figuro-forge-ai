
import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PromptForm from "@/components/PromptForm";
import ImagePreview from "@/components/ImagePreview";
import ModelViewer from "@/components/ModelViewer";
import Footer from "@/components/Footer";
import { useToast } from "@/components/ui/use-toast";

const Studio = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Simulate image generation
  const handleGenerate = (prompt: string, style: string) => {
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setModelUrl(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, this would be an API call to OpenAI or similar
      const placeholderImg = "https://images.unsplash.com/photo-1637140945341-f28ada987326";
      setGeneratedImage(placeholderImg);
      setIsGeneratingImage(false);
      toast({
        title: "Image generated",
        description: `Created "${prompt}" in ${style} style`,
      });
    }, 2000);
  };

  // Simulate 3D conversion
  const handleConvertTo3D = () => {
    setIsConverting(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, this would call Hugging Face or similar API
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
