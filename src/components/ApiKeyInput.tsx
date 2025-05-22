
import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Key } from "lucide-react";

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onSubmit: () => void;
}

const ApiKeyInput = ({ apiKey, setApiKey, onSubmit }: ApiKeyInputProps) => {
  const { toast } = useToast();

  const handleApiKeySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (apiKey) {
      onSubmit();
      localStorage.setItem("tempHuggingFaceApiKey", apiKey);
      toast({
        title: "API Key Saved",
        description: "Your API key has been temporarily saved for this session",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-xl max-w-md mx-auto mb-8"
    >
      <div className="flex items-center gap-2 mb-4 text-figuro-accent">
        <Key size={18} />
        <h3 className="font-semibold">API Key Required</h3>
      </div>
      
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
            The API requires authentication for higher usage limits.
            <br />
            Your API key is only stored temporarily in your browser's local storage.
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
  );
};

export default ApiKeyInput;
