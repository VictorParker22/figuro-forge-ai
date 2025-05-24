import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { Suspense } from "react";
import LoadingSpinner from "./LoadingSpinner";
import DummyBox from "./DummyBox";
import ErrorBoundary from "./ErrorBoundary";
import Model3D from "./Model3D";

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
  
  useEffect(() => {
    if (modelUrl !== currentSourceRef.current) {
      console.log("ModelScene: URL source changed to", modelUrl);
      
      const current = currentSourceRef.current;
      currentSourceRef.current = modelUrl;
      
      if (modelUrl || (current !== null && modelUrl !== current)) {
        setLoadKey(`load-${Date.now()}`);
        
        const timer = setTimeout(() => {
          setStableSource(modelUrl);
          if (modelUrl) setStableBlob(null);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [modelUrl]);
  
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
    console.error("ModelScene: Error in 3D model:", error);
    onModelError(error);
  };

  return (
    <div className="w-full h-full model-scene-container">
      <Canvas 
        key={loadKey}
        shadows 
        gl={{ 
          powerPreference: "low-power",
          antialias: false,
          depth: true,
          stencil: false,
          alpha: true
        }}
        dpr={[0.8, 1]}
        frameloop="demand"
      >
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
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
          autoRotateSpeed={2}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
        />
        <Environment preset="sunset" />
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

// Helper function to clean URLs of cache parameters
function cleanUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    ['t', 'cb', 'cache'].forEach(param => {
      parsedUrl.searchParams.delete(param);
    });
    return parsedUrl.toString();
  } catch (e) {
    return url;
  }
}