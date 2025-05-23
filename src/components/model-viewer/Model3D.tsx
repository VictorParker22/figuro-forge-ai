
import React from "react";
import { Center } from "@react-three/drei";
import LoadingSpinner from "./LoadingSpinner";
import { useModelLoader } from "./hooks/useModelLoader";

interface Model3DProps {
  modelSource: string | null;
  modelBlob?: Blob | null;
  onError: (error: any) => void;
}

const Model3D = ({ modelSource, modelBlob, onError }: Model3DProps) => {
  const { loading, model } = useModelLoader({ 
    modelSource, 
    modelBlob, 
    onError 
  });
  
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
