
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

type ExamplePrompt = {
  title: string;
  prompt: string;
};

const ISOMETRIC_EXAMPLES: ExamplePrompt[] = [
  { 
    title: "Cyber Cat",
    prompt: "A cyberpunk cat warrior with glowing neon armor"
  },
  { 
    title: "Space Explorer",
    prompt: "An astronaut explorer with detailed space suit and equipment"
  },
  { 
    title: "Fantasy Wizard",
    prompt: "A wizard with flowing robes casting a magical spell"
  },
  { 
    title: "Robot Friend",
    prompt: "A friendly robot assistant with various tools and gadgets"
  },
  {
    title: "Nature Spirit",
    prompt: "A forest spirit with leaves and vines intertwined in their form"
  },
];

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const ExamplePrompts = ({ onSelectPrompt }: ExamplePromptsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel p-6 rounded-xl mt-6 backdrop-blur-md border border-white/20"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} className="text-yellow-300" />
        <h3 className="font-medium text-white/80">Try These Ideas</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ISOMETRIC_EXAMPLES.map((example, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => onSelectPrompt(example.prompt)}
            className="justify-start bg-white/5 border-white/20 hover:bg-white/10 hover:border-figuro-accent/40 text-left transition-all group"
          >
            <div>
              <span className="block text-figuro-accent font-medium group-hover:text-figuro-accent">{example.title}</span>
              <span className="text-xs text-white/60 truncate block">{example.prompt}</span>
            </div>
          </Button>
        ))}
      </div>
      <p className="text-xs text-white/50 mt-3">
        Click any example to use it as your prompt. The current style will be applied automatically.
      </p>
    </motion.div>
  );
};

export default ExamplePrompts;
