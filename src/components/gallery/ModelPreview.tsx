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

const ModelContent = ({ 
  modelUrl, 
  isVisible,
  onError 
}: { 
  modelUrl: string; 
  isVisible: boolean;
  onError: (error: any) => void;
}) => {
  const modelIdRef = useRef(`preview-${modelUrl.split('/').pop()?.split('?')[0]}-${Math.random().toString(36).substring(2, 9)}`);
  
  const cleanUrl = useMemo(() => {
    try {
      const url = new URL(modelUrl);
      ['t', 'cb', 'cache'].forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
        }
      });
      return url.toString();
    } catch (e) {
      return modelUrl;
    }
  }, [modelUrl]);
  
  const { loading, model, error } = useOptimizedModelLoader({ 
    modelSource: cleanUrl,
    visible: isVisible,
    modelId: modelIdRef.current,
    priority: isVisible ? 1 : 0,
    maxRetries: 3,
    onError: (err) => {
      // Only propagate non-abort errors
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error(`Error loading model ${cleanUrl}:`, err);
        onError(err);
      } else {
        console.log(`Model load aborted for ${cleanUrl}`);
      }
    }
  });
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error || !model) {
    return <DummyBox />;
  }
  
  return (
    <primitive object={model} scale={1.5} />
  );
};

const ModelPreview: React.FC<ModelPreviewProps> = ({ modelUrl, fileName }) => {
  const [hasError, setHasError] = useState(false);
  const { targetRef, isIntersecting, wasEverVisible } = useIntersectionObserver({
    rootMargin: '200px',
    threshold: 0.1,
    once: true
  });
  
  const cleanModelUrl = useMemo(() => {
    try {
      const url = new URL(modelUrl);
      ['t', 'cb', 'cache'].forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
        }
      });
      return url.toString();
    } catch (e) {
      return modelUrl;
    }
  }, [modelUrl]);
  
  const handleError = (error: any) => {
    // Only set error state for non-abort errors
    if (!(error instanceof DOMException && error.name === 'AbortError') && 
        !(error instanceof Error && error.message.includes('already being loaded'))) {
      console.error(`ModelPreview error for ${fileName}:`, error);
      setHasError(true);
    }
  };

  if (hasError) {
    return <ModelPlaceholder fileName={fileName} />;
  }

  const canvasId = useRef(`canvas-${fileName.replace(/\W/g, '')}-${Math.random().toString(36).substring(2, 10)}`);

  return (
    <div className="w-full h-full" ref={targetRef as React.RefObject<HTMLDivElement>}>
      {(isIntersecting || wasEverVisible) ? (
        <ErrorBoundary fallback={<ModelPlaceholder fileName={fileName} />} onError={handleError}>
          <Canvas 
            id={canvasId.current}
            shadows 
            gl={{ 
              powerPreference: "low-power",
              antialias: false,
              depth: true,
              stencil: false,
              alpha: true
            }}
            dpr={[0.8, 1]}
            style={{pointerEvents: "none"}}
            frameloop="demand"
          >
            <color attach="background" args={['#1a1a1a']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            
            <Suspense fallback={<LoadingSpinner />}>
              <ModelContent 
                modelUrl={cleanModelUrl} 
                isVisible={isIntersecting || wasEverVisible} 
                onError={handleError}
              />
            </Suspense>
            
            <OrbitControls 
              autoRotate={isIntersecting}
              autoRotateSpeed={1.5}
              enablePan={false}
              enableZoom={false}
              enableRotate={false}
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