
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
  
  // Force a remount of the entire scene when the source changes significantly
  useEffect(() => {
    console.log("[ModelScene] URL source changed to", modelUrl);
    
    // If this is a completely new URL
    if (modelUrl !== currentSourceRef.current) {
      currentSourceRef.current = modelUrl;
      
      // Generate new load key to force proper re-mounting
      const newLoadKey = `load-${Date.now()}`;
      setLoadKey(newLoadKey);
      console.log("[ModelScene] Forcing remount with new key:", newLoadKey);
      
      // Update the stable source
      setStableSource(modelUrl);
      
      // Clear blob when URL changes
      if (modelUrl) setStableBlob(null);
    }
  }, [modelUrl]);
  
  // Separate effect for blob changes to prevent dependencies conflicts
  useEffect(() => {
    if (modelBlob && modelBlob !== currentSourceRef.current) {
      console.log("[ModelScene] Blob source changed");
      
      // Generate new load key to force proper re-mounting
      const newLoadKey = `load-${Date.now()}`;
      setLoadKey(newLoadKey);
      console.log("[ModelScene] Forcing remount with new key:", newLoadKey);
      
      currentSourceRef.current = modelBlob;
      setStableBlob(modelBlob);
      
      // Clear URL when blob changes
      if (modelBlob) setStableSource(null);
    }
  }, [modelBlob]);

  // Handler for errors in the 3D model
  const handleModelError = (error: any) => {
    console.error("[ModelScene] Error in 3D model:", error);
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
