import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ModelHeader from "./ModelHeader";
import ModelFooter from "./ModelFooter";
import LoadingView from "./LoadingView";
import ErrorView from "./ErrorView";
import ModelScene from "./ModelScene";
import ModelStats from "./ModelStats";
import ModelMetadata from "./ModelMetadata";
import ModelCreator from "./ModelCreator";
import ModelInteraction from "./ModelInteraction";
import ModelViewControls from "./ModelViewControls";
import { useModelViewerState } from "./useModelViewerState";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EnhancedModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
  progress?: number;
  errorMessage?: string | null;
  onCustomModelLoad?: (url: string, file: File) => void;
  onClose?: () => void;
  title?: string;
  tags?: string[];
  createdAt?: string;
  creatorName?: string;
  creatorAvatar?: string;
  isDialog?: boolean;
}

const EnhancedModelViewer: React.FC<EnhancedModelViewerProps> = ({ 
  modelUrl, 
  isLoading, 
  progress = 0, 
  errorMessage = null,
  onCustomModelLoad,
  onClose,
  title = "3D Model",
  tags = ["Figurine", "AI Generated"],
  createdAt,
  creatorName,
  creatorAvatar,
  isDialog = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Model viewer state
  const {
    autoRotate,
    setAutoRotate,
    modelError,
    customFile,
    fileInputRef,
    displayModelUrl,
    customModelBlob,
    shouldShowError,
    handleFileChange,
    triggerFileInputClick,
    handleDownload,
    handleModelError
  } = useModelViewerState(modelUrl, onCustomModelLoad);
  
  // Enhanced viewer state
  const [isWireframe, setIsWireframe] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isTexturesVisible, setIsTexturesVisible] = useState(true);
  const [isCustomLighting, setIsCustomLighting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelStats, setModelStats] = useState({ faces: 0, vertices: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 50));
  const [comments, setComments] = useState(Math.floor(Math.random() * 10));
  
  // Generate random seeds for display
  const modelSeed = useRef(Math.floor(Math.random() * 100000000).toString());
  const textureSeed = useRef(Math.floor(Math.random() * 100000000).toString());
  
  // Use creator info from props or fallback to current user
  const displayCreatorName = creatorName || profile?.full_name || user?.email?.split('@')[0] || "Anonymous";
  const displayCreatorAvatar = creatorAvatar || profile?.avatar_url || `https://www.gravatar.com/avatar/${user?.email ? user.email.trim().toLowerCase() : ''}?d=mp`;
  
  // Handle toggle wireframe
  const handleToggleWireframe = useCallback(() => {
    setIsWireframe(prev => !prev);
    toast({
      title: isWireframe ? "Wireframe disabled" : "Wireframe enabled",
    });
  }, [isWireframe, toast]);
  
  // Handle toggle grid
  const handleToggleGrid = useCallback(() => {
    setIsGridVisible(prev => !prev);
    toast({
      title: isGridVisible ? "Grid disabled" : "Grid enabled",
    });
  }, [isGridVisible, toast]);
  
  // Handle toggle textures
  const handleToggleTextures = useCallback(() => {
    setIsTexturesVisible(prev => !prev);
    toast({
      title: isTexturesVisible ? "Textures disabled" : "Textures enabled",
    });
  }, [isTexturesVisible, toast]);
  
  // Handle toggle lighting
  const handleToggleLighting = useCallback(() => {
    setIsCustomLighting(prev => !prev);
    toast({
      title: isCustomLighting ? "Default lighting" : "Custom lighting",
    });
  }, [isCustomLighting, toast]);
  
  // Handle toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        toast({
          title: "Fullscreen error",
          description: `Error attempting to enable fullscreen: ${err.message}`,
          variant: "destructive"
        });
      });
    } else {
      document.exitFullscreen();
    }
  }, [toast]);
  
  // Update fullscreen state based on document state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle like
  const handleLike = useCallback(() => {
    setIsLiked(prev => !prev);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    toast({
      title: isLiked ? "Removed like" : "Added like",
    });
  }, [isLiked, toast]);
  
  // Handle save
  const handleSave = useCallback(() => {
    setIsSaved(prev => !prev);
    toast({
      title: isSaved ? "Removed from saved" : "Saved to collection",
    });
  }, [isSaved, toast]);
  
  // Handle comment
  const handleComment = useCallback(() => {
    toast({
      title: "Comments",
      description: "Comments feature coming soon",
    });
  }, [toast]);
  
  // Handle share
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out this 3D model: ${title}`,
        url: window.location.href,
      })
      .then(() => {
        toast({
          title: "Shared successfully",
        });
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "URL copied to clipboard",
          description: "Share this link with others"
        });
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "URL copied to clipboard",
        description: "Share this link with others"
      });
    }
  }, [title, toast]);
  
  // Update model stats when model changes
  useEffect(() => {
    if (!isLoading && !shouldShowError) {
      // Simulate getting stats from the model
      setModelStats({
        faces: Math.floor(Math.random() * 50000) + 10000,
        vertices: Math.floor(Math.random() * 30000) + 5000
      });
    }
  }, [isLoading, shouldShowError]);

  // Skip rendering if there's nothing to display
  if (!modelUrl && !customFile && !isLoading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`glass-panel rounded-xl overflow-hidden ${isDialog ? 'h-full' : 'h-[600px]'} flex flex-col relative`}
      ref={containerRef}
    >
      {isDialog && onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 h-8 w-8 bg-black/50 text-white/70 hover:text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X size={16} />
        </Button>
      )}
      
      <ModelHeader 
        displayModelUrl={displayModelUrl}
        autoRotate={autoRotate}
        onAutoRotateToggle={() => setAutoRotate(!autoRotate)}
        onUploadClick={triggerFileInputClick}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".glb"
        className="hidden"
      />

      <div className="flex-grow relative">
        {isLoading ? (
          <LoadingView progress={progress} />
        ) : shouldShowError ? (
          <ErrorView errorMessage={errorMessage || modelError} displayModelUrl={displayModelUrl} />
        ) : (
          <div className="relative w-full h-full">
            <ModelScene 
              modelUrl={customModelBlob ? null : displayModelUrl}
              modelBlob={customModelBlob}
              autoRotate={autoRotate} 
              onModelError={handleModelError}
            />
            
            {/* Model Stats */}
            <ModelStats 
              topology="Quad" 
              faces={modelStats.faces} 
              vertices={modelStats.vertices} 
              isLoading={isLoading}
            />
            
            {/* View Controls */}
            <ModelViewControls 
              onToggleWireframe={handleToggleWireframe}
              onToggleGrid={handleToggleGrid}
              onToggleTextures={handleToggleTextures}
              onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
              onToggleFullscreen={handleToggleFullscreen}
              onToggleLighting={handleToggleLighting}
              isWireframe={isWireframe}
              isGridVisible={isGridVisible}
              isTexturesVisible={isTexturesVisible}
              isAutoRotating={autoRotate}
              isFullscreen={isFullscreen}
              isCustomLighting={isCustomLighting}
            />
          </div>
        )}
      </div>
      
      <div className="p-4 bg-black/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left column - Model Metadata */}
          <div className="md:col-span-2">
            <ModelMetadata 
              name={title}
              tags={tags}
              modelSeed={modelSeed.current}
              textureSeed={textureSeed.current}
            />
          </div>
          
          {/* Right column - Creator Info */}
          <div>
            <ModelCreator 
              username={displayCreatorName}
              avatarUrl={displayCreatorAvatar}
              published={Math.floor(Math.random() * 100) + 10}
              featured={Math.floor(Math.random() * 30)}
              followers={Math.floor(Math.random() * 500) + 50}
              following={Math.floor(Math.random() * 200) + 20}
              createdAt={createdAt || new Date().toISOString()}
              onFollow={() => toast({ title: "Follow feature coming soon" })}
            />
          </div>
        </div>
        
        {/* Interaction Bar */}
        <div className="mt-4">
          <ModelInteraction 
            likes={likes}
            comments={comments}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onDownload={handleDownload}
            onSave={handleSave}
            isLiked={isLiked}
            isSaved={isSaved}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedModelViewer;