
import React, { useState, useEffect, useRef } from "react";
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
  // Track the current model source to prevent unnecessary re-renders
  const currentSourceRef = useRef<string | Blob | null>(null);
  const [stableSource, setStableSource] = useState<string | null>(modelUrl);
  const [stableBlob, setStableBlob] = useState<Blob | null>(modelBlob || null);
  const [loadKey, setLoadKey] = useState<string>(`load-${Date.now()}`);
  
  // Stabilize the source to prevent rapid changes
  useEffect(() => {
    // Only update if there's been a significant change in modelUrl
    // and it's different from what we're currently tracking
    if (modelUrl !== currentSourceRef.current) {
      console.log("ModelScene: URL source changed to", modelUrl);
      
      // Clear any previous timeouts
      const current = currentSourceRef.current;
      currentSourceRef.current = modelUrl;
      
      // If this is a completely new URL (not just undefined → undefined)
      if (modelUrl || (current !== null && modelUrl !== current)) {
        // Generate new load key to force proper re-mounting
        setLoadKey(`load-${Date.now()}`);
        
        // Small delay to ensure stable updates and prevent thrashing
        const timer = setTimeout(() => {
          setStableSource(modelUrl);
          // Clear blob when URL changes
          if (modelUrl) setStableBlob(null);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [modelUrl]);
  
  // Separate effect for blob changes to prevent dependencies conflicts
  useEffect(() => {
    // Only update if the blob itself has changed and is not null
    if (modelBlob && modelBlob !== currentSourceRef.current) {
      console.log("ModelScene: Blob source changed");
      
      // Generate new load key to force proper re-mounting
      setLoadKey(`load-${Date.now()}`);
      currentSourceRef.current = modelBlob;
      
      // Small delay to ensure stable updates
      const timer = setTimeout(() => {
        setStableBlob(modelBlob);
        // Clear URL when blob changes
        if (modelBlob) setStableSource(null);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [modelBlob]);

  // Handler for errors in the 3D model
  const handleModelError = (error: any) => {
    console.error("ModelScene: Error in 3D model:", error);
    onModelError(error);
  };

  return (
    <Canvas shadows key={loadKey}>
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
      />
      <Environment preset="sunset" />
    </Canvas>
  );
};

export default ModelScene;
