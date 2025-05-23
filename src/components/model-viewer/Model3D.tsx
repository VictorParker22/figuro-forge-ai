
import React, { useRef, useEffect } from "react";
import { Center } from "@react-three/drei";
import LoadingSpinner from "./LoadingSpinner";
import { useModelLoader } from "./hooks/useModelLoader";

interface Model3DProps {
  modelSource: string | null;
  modelBlob?: Blob | null;
  onError: (error: any) => void;
}

const Model3D = ({ modelSource, modelBlob, onError }: Model3DProps) => {
  // Create a stable ID for this model with better uniqueness
  const modelIdRef = useRef<string>(`model3d-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`);
  
  // Extract model name from URL for better logging
  const modelName = modelSource 
    ? modelSource.split('/').pop()?.split('?')[0] || 'unknown-model' 
    : modelBlob 
      ? 'blob-model' 
      : 'no-model';
  
  console.log(`[Model3D] Initializing for model: ${modelName}, ID: ${modelIdRef.current}`);
  
  const { loading, model } = useModelLoader({ 
    modelSource, 
    modelBlob,
    modelId: modelIdRef.current,
    onError 
  });

  // Debug logging for tracking model load status
  useEffect(() => {
    if (model) {
      console.log(`[Model3D] Model successfully loaded: ${modelName}, ID: ${modelIdRef.current}`);
    }
  }, [model, modelName]);
  
  // Make sure to clean up on unmount
  useEffect(() => {
    return () => {
      console.log(`[Model3D] Component unmounting for ${modelIdRef.current}`);
    };
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return model ? (
    <Center scale={[1.5, 1.5, 1.5]}>
      <primitive object={model} />
    </Center>
  ) : null;
};

export default Model3D;
