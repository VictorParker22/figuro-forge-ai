
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
  const modelIdRef = useRef(`preview-${modelUrl.split('/').pop()?.split('?')[0]}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Clean URL from query parameters to prevent cache busting which causes reloads
  const cleanUrl = useMemo(() => {
    try {
      const url = new URL(modelUrl);
      // Remove all cache-busting parameters
      ['t', 'cb', 'cache'].forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
        }
      });
      return url.toString();
    } catch (e) {
      // If URL parsing fails, return the original
      return modelUrl;
    }
  }, [modelUrl]);
  
  const { loading, model, error } = useOptimizedModelLoader({ 
    modelSource: cleanUrl,
    visible: isVisible,
    modelId: modelIdRef.current,
    onError: (err) => console.error(`Error loading model ${cleanUrl}:`, err)
  });
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error || !model) {
    console.error(`Failed to load model: ${cleanUrl}`, error);
    return <DummyBox />;
  }
  
  return (
    <primitive object={model} scale={1.5} />
  );
};

const ModelPreview: React.FC<ModelPreviewProps> = ({ modelUrl, fileName }) => {
  const [hasError, setHasError] = useState(false);
  const { targetRef, isIntersecting, wasEverVisible } = useIntersectionObserver({
    rootMargin: '200px', // Reduced from 300px to improve performance
    threshold: 0.1,
    once: true // Only observe once, then disconnect to prevent re-intersection triggers
  });
  
  // Clean URL from query params for better caching
  const cleanModelUrl = useMemo(() => {
    try {
      const url = new URL(modelUrl);
      // Remove all cache-busting parameters
      ['t', 'cb', 'cache'].forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
        }
      });
      return url.toString();
    } catch (e) {
      // If URL parsing fails, return the original
      return modelUrl;
    }
  }, [modelUrl]);
  
  // Handle errors silently by showing the placeholder
  const handleError = (error: any) => {
    console.error(`ModelPreview error for ${fileName}:`, error);
    setHasError(true);
  };

  // If there's an error, show the placeholder
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
              powerPreference: "low-power", // Use low-power to save resources
              antialias: false, // Disable for performance
              depth: true,
              stencil: false,
              alpha: true
            }}
            dpr={[0.8, 1]} // Further reduce resolution for better performance (was [1, 1.2])
            style={{pointerEvents: "none"}} // Disable pointer events to prevent interaction in gallery view
            frameloop="demand" // Only render when needed
          >
            <color attach="background" args={['#1a1a1a']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            
            <Suspense fallback={<LoadingSpinner />}>
              <ModelContent modelUrl={cleanModelUrl} isVisible={isIntersecting || wasEverVisible} />
            </Suspense>
            
            <OrbitControls 
              autoRotate={isIntersecting} // Only auto-rotate when visible
              autoRotateSpeed={1.5} // Reduced from 4 for better performance
              enablePan={false}
              enableZoom={false}
              enableRotate={false} // Disabled rotation for gallery view
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
