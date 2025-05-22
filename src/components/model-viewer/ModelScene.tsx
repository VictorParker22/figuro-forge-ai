
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
  const [stableSource, setStableSource] = useState<string | Blob | null>(modelBlob || modelUrl);
  
  // Stabilize the source to prevent rapid changes
  useEffect(() => {
    // Determine the current source (prefer Blob over URL)
    const currentSource = modelBlob || modelUrl;
    
    // Only update if the source has actually changed
    if (currentSource !== currentSourceRef.current) {
      console.log("ModelScene: Source changed to", 
        typeof currentSource === 'string' ? currentSource : 'Blob object');
      currentSourceRef.current = currentSource;
      
      // Small delay to ensure stable updates
      const timer = setTimeout(() => {
        setStableSource(currentSource);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [modelUrl, modelBlob]);

  // Handler for errors in the 3D model
  const handleModelError = (error: any) => {
    console.error("ModelScene: Error in 3D model:", error);
    onModelError(error);
  };

  return (
    <Canvas shadows>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      
      <Suspense fallback={<LoadingSpinner />}>
        {stableSource ? (
          <ErrorBoundary 
            fallback={<DummyBox />} 
            onError={handleModelError}
          >
            <Model3D modelSource={stableSource} onError={handleModelError} />
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
