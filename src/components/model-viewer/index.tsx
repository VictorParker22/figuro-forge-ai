import React from "react";
import { motion } from "framer-motion";
import ModelHeader from "./ModelHeader";
import ModelFooter from "./ModelFooter";
import LoadingView from "./LoadingView";
import ErrorView from "./ErrorView";
import ModelScene from "./ModelScene";
import { useModelViewerState } from "./useModelViewerState";

interface ModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
  progress?: number;
  errorMessage?: string | null;
  onCustomModelLoad?: (url: string, file: File) => void;
}

const ModelViewer = ({ 
  modelUrl, 
  isLoading, 
  progress = 0, 
  errorMessage = null,
  onCustomModelLoad
}: ModelViewerProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  
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

  // Skip rendering if there's nothing to display
  if (!modelUrl && !customFile && !isLoading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-xl overflow-hidden h-full flex flex-col"
      ref={containerRef}
    >
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
          <ModelScene 
            modelUrl={customModelBlob ? null : displayModelUrl}
            modelBlob={customModelBlob}
            autoRotate={autoRotate} 
            onModelError={handleModelError}
          />
        )}
      </div>
      
      <ModelFooter 
        displayModelUrl={displayModelUrl}
        customFileName={customFile?.name || null}
        onDownload={handleDownload}
      />
    </motion.div>
  );
};

export default ModelViewer;