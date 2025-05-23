import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { ErrorBoundary } from "@/components/model-viewer/ErrorBoundary";
import DummyBox from "@/components/model-viewer/DummyBox";
import LoadingSpinner from "@/components/model-viewer/LoadingSpinner";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useOptimizedModelLoader } from "@/components/model-viewer/hooks/useOptimizedModelLoader";
import ModelPlaceholder from "./ModelPlaceholder";

interface ModelPreviewProps {
  modelUrl: string;
  fileName: string;
}

// This component will render the actual 3D model
const ModelContent = ({ 
  modelUrl, 
  isVisible 
}: { 
  modelUrl: string; 
  isVisible: boolean 
}) => {
  // Create a stable ID based on the URL to prevent reloads
  const modelIdRef = useRef(`preview-${modelUrl.split('/').pop()?.split('?')[0]}`);
  
  console.log(`ModelContent: Loading ${modelUrl}, visible: ${isVisible}, id: ${modelIdRef.current}`);
  
  const { loading, model, error } = useOptimizedModelLoader({ 
    modelSource: modelUrl, 
    visible: isVisible,
    modelId: modelIdRef.current,
    onError: (err) => console.error(`Error loading model ${modelUrl}:`, err)
  });
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error || !model) {
    console.error(`Failed to load model: ${modelUrl}`, error);
    return <DummyBox />;
  }
  
  return (
    <primitive object={model} scale={1.5} />
  );
};

const ModelPreview: React.FC<ModelPreviewProps> = ({ modelUrl, fileName }) => {
  const [hasError, setHasError] = useState(false);
  const { targetRef, isIntersecting, wasEverVisible } = useIntersectionObserver({
    rootMargin: '300px', // Increased margin to load earlier
    threshold: 0.1,
    once: true // Only observe once, then disconnect to prevent re-intersection triggers
  });
  
  // Clean URL from query params for better caching
  const cleanModelUrl = useMemo(() => {
    const url = new URL(modelUrl);
    // Keep only necessary query parameters if any
    return url.toString();
  }, [modelUrl]);
  
  // Handle errors silently by showing the placeholder
  const handleError = (error: any) => {
    console.error(`ModelPreview error for ${fileName}:`, error);
    setHasError(true);
  };

  useEffect(() => {
    console.log(`ModelPreview ${fileName}: ${isIntersecting ? 'visible' : 'not visible'}, ever visible: ${wasEverVisible}`);
  }, [isIntersecting, wasEverVisible, fileName]);

  if (hasError) {
    return <ModelPlaceholder fileName={fileName} />;
  }

  // Create unique ID for this preview canvas to avoid conflicts
  const canvasId = useRef(`canvas-${fileName.replace(/\W/g, '')}-${Math.random().toString(36).substring(2, 10)}`);

  return (
    <div className="w-full h-full" ref={targetRef as React.RefObject<HTMLDivElement>}>
      {(isIntersecting || wasEverVisible) ? (
        <ErrorBoundary fallback={<ModelPlaceholder fileName={fileName} />} onError={handleError}>
          <Canvas 
            id={canvasId.current}
            shadows 
            gl={{ 
              powerPreference: "default",
              antialias: false, // Disable for performance
              depth: true,
              stencil: false,
              alpha: true
            }}
            dpr={[1, 1.5]} // Limit resolution for performance
          >
            <color attach="background" args={['#1a1a1a']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            
            <Suspense fallback={<LoadingSpinner />}>
              <ModelContent modelUrl={cleanModelUrl} isVisible={isIntersecting || wasEverVisible} />
            </Suspense>
            
            <OrbitControls 
              autoRotate={true}
              autoRotateSpeed={4}
              enablePan={false}
              enableZoom={false}
              enableRotate={true}
            />
            <Environment preset="sunset" />
          </Canvas>
        </ErrorBoundary>
      ) : (
        <ModelPlaceholder fileName={fileName} />
      )}
    </div>
  );
};

export default ModelPreview;
