
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ExamplePrompts from "@/components/ExamplePrompts";
import { Sparkles } from "lucide-react";

const ART_STYLES = [
  { id: "isometric", name: "Isometric Skeuomorphic" },
  { id: "anime", name: "Anime" },
  { id: "pixar", name: "Pixar" },
  { id: "steampunk", name: "Steampunk" },
  { id: "lowpoly", name: "Low Poly" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "realistic", name: "Realistic" },
  { id: "chibi", name: "Chibi" }
];

interface PromptFormProps {
  onGenerate: (prompt: string, style: string) => void;
  isGenerating: boolean;
}

const PromptForm = ({ onGenerate, isGenerating }: PromptFormProps) => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("isometric"); // Isometric is already the default

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt, style);
  };

  const handleExampleSelect = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    // Optionally auto-submit the form with the example
    // onGenerate(examplePrompt, style);
  };

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-6 rounded-xl backdrop-blur-md border border-white/20 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Describe Your Figurine</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-figuro-accent/20 text-figuro-accent">Step 1</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="prompt"
                placeholder="e.g. Cyberpunk cat with laser sword"
                className="bg-white/10 border-white/20 text-white focus:border-figuro-accent pl-4 pr-10 py-6"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Sparkles className="absolute right-3 top-3 text-figuro-accent/70" size={16} />
            </div>
            <p className="text-xs text-white/50">
              Describe the subject you want for your figurine. Isometric style will be applied by default.
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="style" className="text-sm text-white/70 flex items-center gap-2">
              <span>Art Style</span>
              <span className="h-px flex-grow bg-white/10"></span>
            </label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent className="bg-figuro-darker border-white/20 backdrop-blur-md">
                {ART_STYLES.map((artStyle) => (
                  <SelectItem key={artStyle.id} value={artStyle.id} className="focus:bg-figuro-accent/20">
                    {artStyle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="submit"
            className={`w-full bg-figuro-accent hover:bg-figuro-accent-hover ${isGenerating ? 'animate-pulse' : ''} h-12`}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <span className="mr-2">Generating...</span>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              </>
            ) : (
              <>Generate Figurine</>
            )}
          </Button>
        </form>
      </motion.div>
      
      <div className="flex-grow">
        <ExamplePrompts onSelectPrompt={handleExampleSelect} />
      </div>
    </div>
  );
};

export default PromptForm;
