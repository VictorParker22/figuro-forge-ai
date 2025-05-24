import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { ErrorBoundary } from "@/components/model-viewer/ErrorBoundary";
import DummyBox from "@/components/model-viewer/DummyBox";
import LoadingSpinner from "@/components/model-viewer/LoadingSpinner";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useOptimizedModelLoader } from "@/components/model-viewer/hooks/useOptimizedModelLoader";
import ModelPlaceholder from "./ModelPlaceholder";
import { cleanUrl } from "@/components/model-viewer/utils/modelUtils";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_AMBIENT_LIGHT_INTENSITY,
  DEFAULT_DIRECTIONAL_LIGHT_POSITION,
  DEFAULT_DIRECTIONAL_LIGHT_INTENSITY,
  DEFAULT_ENVIRONMENT_PRESET,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_DPR,
  GALLERY_PREVIEW_ORBIT_CONTROLS,
  DEFAULT_MODEL_SCALE,
  MEDIUM_PRIORITY
} from "@/components/model-viewer/config/modelViewerConfig";

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
    return cleanUrl(modelUrl);
  }, [modelUrl]);
  
  const { loading, model, error } = useOptimizedModelLoader({ 
    modelSource: cleanUrl,
    visible: isVisible,
    modelId: modelIdRef.current,
    priority: MEDIUM_PRIORITY,
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
    <primitive object={model} scale={DEFAULT_MODEL_SCALE} />
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
    return cleanUrl(modelUrl);
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
            gl={DEFAULT_CANVAS_CONFIG}
            dpr={DEFAULT_DPR}
            style={{pointerEvents: "none"}}
            frameloop="demand"
          >
            <color attach="background" args={[DEFAULT_BACKGROUND_COLOR]} />
            <ambientLight intensity={DEFAULT_AMBIENT_LIGHT_INTENSITY} />
            <directionalLight 
              position={DEFAULT_DIRECTIONAL_LIGHT_POSITION} 
              intensity={DEFAULT_DIRECTIONAL_LIGHT_INTENSITY} 
            />
            <PerspectiveCamera makeDefault position={DEFAULT_CAMERA_POSITION} />
            
            <Suspense fallback={<LoadingSpinner />}>
              <ModelContent 
                modelUrl={cleanModelUrl} 
                isVisible={isIntersecting || wasEverVisible} 
                onError={handleError}
              />
            </Suspense>
            
            <OrbitControls 
              autoRotate={isIntersecting}
              autoRotateSpeed={GALLERY_PREVIEW_ORBIT_CONTROLS.autoRotateSpeed}
              enablePan={GALLERY_PREVIEW_ORBIT_CONTROLS.enablePan}
              enableZoom={GALLERY_PREVIEW_ORBIT_CONTROLS.enableZoom}
              enableRotate={GALLERY_PREVIEW_ORBIT_CONTROLS.enableRotate}
            />
            <Environment preset={DEFAULT_ENVIRONMENT_PRESET} />
          </Canvas>
        </ErrorBoundary>
      ) : (
        <ModelPlaceholder fileName={fileName} />
      )}
    </div>
  );
};

export default React.memo(ModelPreview, (prevProps, nextProps) => {
  // Only re-render if the URL has significantly changed (ignoring cache parameters)
  try {
    const prevUrl = new URL(prevProps.modelUrl);
    const nextUrl = new URL(nextProps.modelUrl);
    
    // Remove cache-busting parameters
    CACHE_PARAMS.forEach(param => {
      prevUrl.searchParams.delete(param);
      nextUrl.searchParams.delete(param);
    });
    
    return prevUrl.toString() === nextUrl.toString() && 
           prevProps.fileName === nextProps.fileName;
  } catch (e) {
    // If URL parsing fails, fall back to direct comparison
    return prevProps.modelUrl === nextProps.modelUrl && 
           prevProps.fileName === nextProps.fileName;
  }
});