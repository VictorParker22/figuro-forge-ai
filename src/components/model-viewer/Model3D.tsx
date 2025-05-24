import React, { useRef, useEffect } from "react";
import { Center } from "@react-three/drei";
import LoadingSpinner from "./LoadingSpinner";
import { useModelLoader } from "./hooks/useModelLoader";
import { DEFAULT_MODEL_SCALE, HIGH_PRIORITY } from "./config/modelViewerConfig";

interface Model3DProps {
  modelSource: string | null;
  modelBlob?: Blob | null;
  onError: (error: any) => void;
}

const Model3D = ({ modelSource, modelBlob, onError }: Model3DProps) => {
  // Create a stable ID for this model with better uniqueness
  const modelIdRef = useRef<string>(`model3d-${Math.random().toString(36).substring(2, 10)}`);
  
  // Extract model name from URL for better logging
  const modelName = modelSource ? modelSource.split('/').pop()?.split('?')[0] || 'unknown-model' : 'blob-model';
  
  console.log(`Loading model: ${modelName}, ID: ${modelIdRef.current}`);
  
  const { loading, model } = useModelLoader({ 
    modelSource, 
    modelBlob,
    modelId: modelIdRef.current,
    maxRetries: 2,
    priority: HIGH_PRIORITY,
    onError: (err) => {
      // Only propagate non-abort errors
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        console.error(`Error loading model ${modelName}:`, err);
        onError(err);
      } else {
        console.log(`Model load aborted for ${modelName}`);
      }
    }
  });

  // Debug logging for tracking model load status
  useEffect(() => {
    if (model) {
      console.log(`Model successfully loaded: ${modelName}`);
    }
  }, [model, modelName]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return model ? (
    <Center scale={[DEFAULT_MODEL_SCALE, DEFAULT_MODEL_SCALE, DEFAULT_MODEL_SCALE]}>
      <primitive object={model} />
    </Center>
  ) : null;
};

export default React.memo(Model3D, (prevProps, nextProps) => {
  // Only re-render if the source has changed
  return prevProps.modelSource === nextProps.modelSource && 
         prevProps.modelBlob === nextProps.modelBlob;
});