import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { ErrorBoundary } from "@/components/model-viewer/ErrorBoundary";
import DummyBox from "@/components/model-viewer/DummyBox";
import LoadingSpinner from "@/components/model-viewer/LoadingSpinner";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useOptimizedModelLoader } from "@/components/model-viewer/hooks/useOptimizedModelLoader";
import ModelPlaceholder from "./ModelPlaceholder";

// Import configuration constants
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
  MEDIUM_PRIORITY,
  CACHE_PARAMS
} from "@/components/model-viewer/config/modelViewerConfig";

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
  const cleanModelUrl = useMemo(() => {
    try {
      const url = new URL(modelUrl);
      // Remove all cache-busting parameters
      CACHE_PARAMS.forEach(param => {
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
    modelSource: cleanModelUrl,
    visible: isVisible,
    modelId: modelIdRef.current,
    priority: MEDIUM_PRIORITY,
    onError: (err) => console.error(`Error loading model ${cleanModelUrl}:`, err)
  });
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error || !model) {
    console.error(`Failed to load model: ${cleanModelUrl}`, error);
    return <DummyBox />;
  }
  
  return (
    <primitive object={model} scale={DEFAULT_MODEL_SCALE} />
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
      CACHE_PARAMS.forEach(param => {
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
            gl={DEFAULT_CANVAS_CONFIG}
            dpr={DEFAULT_DPR}
            style={{pointerEvents: "none"}} // Disable pointer events to prevent interaction in gallery view
            frameloop="demand" // Only render when needed
          >
            <color attach="background" args={[DEFAULT_BACKGROUND_COLOR]} />
            <ambientLight intensity={DEFAULT_AMBIENT_LIGHT_INTENSITY} />
            <directionalLight 
              position={DEFAULT_DIRECTIONAL_LIGHT_POSITION} 
              intensity={DEFAULT_DIRECTIONAL_LIGHT_INTENSITY} 
            />
            <PerspectiveCamera makeDefault position={DEFAULT_CAMERA_POSITION} />
            
            <Suspense fallback={<LoadingSpinner />}>
              <ModelContent modelUrl={cleanModelUrl} isVisible={isIntersecting || wasEverVisible} />
            </Suspense>
            
            <OrbitControls 
              autoRotate={isIntersecting} // Only auto-rotate when visible
              autoRotateSpeed={GALLERY_PREVIEW_ORBIT_CONTROLS.autoRotateSpeed} // Reduced from 4 for better performance
              enablePan={GALLERY_PREVIEW_ORBIT_CONTROLS.enablePan}
              enableZoom={GALLERY_PREVIEW_ORBIT_CONTROLS.enableZoom}
              enableRotate={GALLERY_PREVIEW_ORBIT_CONTROLS.enableRotate} // Disabled rotation for gallery view
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