import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { Suspense } from "react";
import LoadingSpinner from "./LoadingSpinner";
import DummyBox from "./DummyBox";
import ErrorBoundary from "./ErrorBoundary";
import Model3D from "./Model3D";
import { cleanUrl } from "./utils/modelUtils";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_AMBIENT_LIGHT_INTENSITY,
  DEFAULT_DIRECTIONAL_LIGHT_POSITION,
  DEFAULT_DIRECTIONAL_LIGHT_INTENSITY,
  DEFAULT_ENVIRONMENT_PRESET,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_CANVAS_CONFIG,
  DEFAULT_DPR,
  DEFAULT_ORBIT_CONTROLS
} from "./config/modelViewerConfig";

interface ModelSceneProps {
  modelUrl: string | null;
  modelBlob?: Blob | null;
  autoRotate: boolean;
  onModelError: (error: any) => void;
}

const ModelScene = ({ modelUrl, modelBlob, autoRotate, onModelError }: ModelSceneProps) => {
  const currentSourceRef = useRef<string | Blob | null>(null);
  const [stableSource, setStableSource] = useState<string | null>(modelUrl);
  const [stableBlob, setStableBlob] = useState<Blob | null>(modelBlob || null);
  const [loadKey, setLoadKey] = useState<string>(`load-${Date.now()}`);
  
  // Clean URL to prevent cache-busting issues
  const cleanedModelUrl = useMemo(() => {
    return modelUrl ? cleanUrl(modelUrl) : null;
  }, [modelUrl]);
  
  useEffect(() => {
    if (cleanedModelUrl !== currentSourceRef.current) {
      console.log("ModelScene: URL source changed to", cleanedModelUrl);
      
      const current = currentSourceRef.current;
      currentSourceRef.current = cleanedModelUrl;
      
      if (cleanedModelUrl || (current !== null && cleanedModelUrl !== current)) {
        setLoadKey(`load-${Date.now()}`);
        
        const timer = setTimeout(() => {
          setStableSource(cleanedModelUrl);
          if (cleanedModelUrl) setStableBlob(null);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [cleanedModelUrl]);
  
  useEffect(() => {
    if (modelBlob && modelBlob !== currentSourceRef.current) {
      console.log("ModelScene: Blob source changed");
      
      setLoadKey(`load-${Date.now()}`);
      currentSourceRef.current = modelBlob;
      
      const timer = setTimeout(() => {
        setStableBlob(modelBlob);
        if (modelBlob) setStableSource(null);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [modelBlob]);

  const handleModelError = (error: any) => {
    // Only propagate non-abort errors
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      console.error("ModelScene: Error in 3D model:", error);
      onModelError(error);
    } else {
      console.log("ModelScene: Load aborted");
    }
  };

  return (
    <div className="w-full h-full model-scene-container">
      <Canvas 
        key={loadKey}
        shadows 
        gl={DEFAULT_CANVAS_CONFIG}
        dpr={DEFAULT_DPR}
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
          {(stableSource || stableBlob) ? (
            <ErrorBoundary 
              fallback={<DummyBox />} 
              onError={handleModelError}
            >
              <Model3D 
                modelSource={stableSource} 
                modelBlob={stableBlob}
                onError={handleModelError} 
              />
            </ErrorBoundary>
          ) : (
            <DummyBox />
          )}
        </Suspense>
        
        <OrbitControls 
          autoRotate={autoRotate}
          autoRotateSpeed={DEFAULT_ORBIT_CONTROLS.autoRotateSpeed}
          enablePan={DEFAULT_ORBIT_CONTROLS.enablePan}
          enableZoom={DEFAULT_ORBIT_CONTROLS.enableZoom}
          enableRotate={DEFAULT_ORBIT_CONTROLS.enableRotate}
          minDistance={DEFAULT_ORBIT_CONTROLS.minDistance}
          maxDistance={DEFAULT_ORBIT_CONTROLS.maxDistance}
        />
        <Environment preset={DEFAULT_ENVIRONMENT_PRESET} />
      </Canvas>
    </div>
  );
};

export default React.memo(ModelScene, (prevProps, nextProps) => {
  // Only re-render if important props have changed
  // For URLs, compare without cache parameters
  const prevUrlString = prevProps.modelUrl ? cleanUrl(prevProps.modelUrl) : null;
  const nextUrlString = nextProps.modelUrl ? cleanUrl(nextProps.modelUrl) : null;
  
  // For blobs, compare by reference
  const blobsEqual = prevProps.modelBlob === nextProps.modelBlob;
  
  return prevUrlString === nextUrlString && 
         blobsEqual && 
         prevProps.autoRotate === nextProps.autoRotate;
});