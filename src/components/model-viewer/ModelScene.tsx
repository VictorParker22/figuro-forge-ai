
import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { Suspense } from "react";
import LoadingSpinner from "./LoadingSpinner";
import DummyBox from "./DummyBox";
import ErrorBoundary from "./ErrorBoundary";
import Model3D from "./Model3D";
import { webGLContextTracker } from "./utils/resourceManager";

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
  const mountedRef = useRef(true);
  const errorRef = useRef<Error | null>(null);
  
  // Register WebGL context on mount
  useEffect(() => {
    mountedRef.current = true;
    webGLContextTracker.registerContext();
    
    return () => {
      mountedRef.current = false;
      webGLContextTracker.releaseContext();
    };
  }, []);
  
  // Force a remount of the entire scene when the source changes significantly
  useEffect(() => {
    console.log("[ModelScene] URL source changed to", modelUrl);
    
    // Skip processing if not mounted
    if (!mountedRef.current) return;
    
    // If this is a completely new URL
    if (modelUrl !== currentSourceRef.current) {
      // If modelBlob is set and modelUrl is null, don't update
      if (!modelUrl && stableBlob) {
        return;
      }
      
      currentSourceRef.current = modelUrl;
      
      // Don't remount if the source is just being cleared and there's no blob
      if (modelUrl === null && !modelBlob) {
        setStableSource(null);
        return;
      }
      
      // Generate new load key to force proper re-mounting
      const newLoadKey = `load-${Date.now()}`;
      setLoadKey(newLoadKey);
      console.log("[ModelScene] Forcing remount with new key:", newLoadKey);
      
      // Update the stable source
      setStableSource(modelUrl);
      
      // Clear blob when URL changes
      if (modelUrl) setStableBlob(null);
      
      // Reset any errors
      errorRef.current = null;
    }
  }, [modelUrl, stableBlob]);
  
  // Separate effect for blob changes to prevent dependencies conflicts
  useEffect(() => {
    if (!mountedRef.current) return;
    
    if (modelBlob && modelBlob !== currentSourceRef.current) {
      console.log("[ModelScene] Blob source changed");
      
      currentSourceRef.current = modelBlob;
      
      // Generate new load key to force proper re-mounting
      const newLoadKey = `load-${Date.now()}`;
      setLoadKey(newLoadKey);
      console.log("[ModelScene] Forcing remount with new key:", newLoadKey);
      
      setStableBlob(modelBlob);
      
      // Clear URL when blob changes
      if (modelBlob) setStableSource(null);
      
      // Reset any errors
      errorRef.current = null;
    }
  }, [modelBlob]);

  // Handler for errors in the 3D model
  const handleModelError = (error: any) => {
    console.error("[ModelScene] Error in 3D model:", error);
    errorRef.current = error;
    
    // Only call the error handler if we're still mounted
    if (mountedRef.current) {
      onModelError(error);
    }
  };

  return (
    <Canvas 
      shadows
      key={loadKey}
      gl={{ 
        powerPreference: "default", 
        antialias: true,
        failIfMajorPerformanceCaveat: false
      }}
    >
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
