import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ModelMetadataProps {
  name: string;
  tags?: string[];
  modelSeed?: string;
  textureSeed?: string;
}

const ModelMetadata: React.FC<ModelMetadataProps> = ({ 
  name, 
  tags = [], 
  modelSeed,
  textureSeed
}) => {
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`
    });
  };

  return (
    <Card className="bg-black/50 border-white/10 w-full">
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-white font-medium mb-2 flex items-center justify-between">
            <span>Name</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-white/50 hover:text-white"
              onClick={() => handleCopy(name, "Name")}
            >
              <Copy size={14} />
            </Button>
          </h3>
          <p className="text-white/90">{name}</p>
        </div>

        {tags.length > 0 && (
          <div>
            <h3 className="text-white font-medium mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {modelSeed && (
          <div>
            <h3 className="text-white font-medium mb-2 flex items-center justify-between">
              <span>Model Seed</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white/50 hover:text-white"
                onClick={() => handleCopy(modelSeed, "Model Seed")}
              >
                <Copy size={14} />
              </Button>
            </h3>
            <p className="text-white/90 font-mono text-sm">{modelSeed}</p>
          </div>
        )}

        {textureSeed && (
          <div>
            <h3 className="text-white font-medium mb-2 flex items-center justify-between">
              <span>Texture Seed</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white/50 hover:text-white"
                onClick={() => handleCopy(textureSeed, "Texture Seed")}
              >
                <Copy size={14} />
              </Button>
            </h3>
            <p className="text-white/90 font-mono text-sm">{textureSeed}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelMetadata;