import React from "react";
import { Button } from "@/components/ui/button";
import { Cuboid as Cube, RotateCcw, Grid3X3, Layers, Maximize, Minimize, SunMoon } from "lucide-react";

interface ModelViewControlsProps {
  onToggleWireframe?: () => void;
  onToggleGrid?: () => void;
  onToggleTextures?: () => void;
  onToggleAutoRotate?: () => void;
  onToggleFullscreen?: () => void;
  onToggleLighting?: () => void;
  isWireframe?: boolean;
  isGridVisible?: boolean;
  isTexturesVisible?: boolean;
  isAutoRotating?: boolean;
  isFullscreen?: boolean;
  isCustomLighting?: boolean;
}

const ModelViewControls: React.FC<ModelViewControlsProps> = ({
  onToggleWireframe,
  onToggleGrid,
  onToggleTextures,
  onToggleAutoRotate,
  onToggleFullscreen,
  onToggleLighting,
  isWireframe = false,
  isGridVisible = false,
  isTexturesVisible = true,
  isAutoRotating = true,
  isFullscreen = false,
  isCustomLighting = false
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        className={`h-8 w-8 rounded-full bg-black/50 border-white/20 ${isWireframe ? 'text-figuro-accent' : 'text-white/70'}`}
        onClick={onToggleWireframe}
        title="Toggle Wireframe"
      >
        <Cube size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className={`h-8 w-8 rounded-full bg-black/50 border-white/20 ${isAutoRotating ? 'text-figuro-accent' : 'text-white/70'}`}
        onClick={onToggleAutoRotate}
        title="Toggle Auto-Rotate"
      >
        <RotateCcw size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className={`h-8 w-8 rounded-full bg-black/50 border-white/20 ${isGridVisible ? 'text-figuro-accent' : 'text-white/70'}`}
        onClick={onToggleGrid}
        title="Toggle Grid"
      >
        <Grid3X3 size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className={`h-8 w-8 rounded-full bg-black/50 border-white/20 ${isTexturesVisible ? 'text-figuro-accent' : 'text-white/70'}`}
        onClick={onToggleTextures}
        title="Toggle Textures"
      >
        <Layers size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className={`h-8 w-8 rounded-full bg-black/50 border-white/20 ${isCustomLighting ? 'text-figuro-accent' : 'text-white/70'}`}
        onClick={onToggleLighting}
        title="Toggle Lighting"
      >
        <SunMoon size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full bg-black/50 border-white/20 text-white/70"
        onClick={onToggleFullscreen}
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </Button>
    </div>
  );
};

export default ModelViewControls;