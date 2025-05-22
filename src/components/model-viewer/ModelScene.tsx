
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
  autoRotate: boolean;
  onModelError: (error: any) => void;
}

const ModelScene = ({ modelUrl, autoRotate, onModelError }: ModelSceneProps) => {
  // Track the current model URL to prevent unnecessary re-renders
  const currentUrlRef = useRef<string | null>(null);
  const [stableUrl, setStableUrl] = useState<string | null>(modelUrl);
  
  // Stabilize the URL to prevent rapid changes
  useEffect(() => {
    // Only update if the URL has actually changed and is not null
    if (modelUrl !== currentUrlRef.current) {
      console.log("ModelScene: URL changed from", currentUrlRef.current, "to", modelUrl);
      currentUrlRef.current = modelUrl;
      
      // Small delay to ensure stable updates
      const timer = setTimeout(() => {
        setStableUrl(modelUrl);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [modelUrl]);

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
        {stableUrl ? (
          <ErrorBoundary 
            fallback={<DummyBox />} 
            onError={handleModelError}
          >
            <Model3D url={stableUrl} onError={handleModelError} />
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
