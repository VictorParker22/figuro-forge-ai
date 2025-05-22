
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
  const [style, setStyle] = useState("isometric");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt, style);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-6 rounded-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm text-white/70">
            Describe your figurine
          </label>
          <Input
            id="prompt"
            placeholder="e.g. Cyberpunk cat with laser sword, chibi style"
            className="bg-white/5 border-white/10 text-white focus:border-figuro-accent"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="style" className="text-sm text-white/70">
            Art Style
          </label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent className="bg-figuro-darker border-white/10">
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
          className={`w-full bg-figuro-accent hover:bg-figuro-accent-hover ${isGenerating ? 'animate-pulse' : ''}`}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? "Generating..." : "Generate Figurine"}
        </Button>
      </form>
    </motion.div>
  );
};

export default PromptForm;
