
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { ErrorBoundary } from "@/components/model-viewer/ErrorBoundary";
import DummyBox from "@/components/model-viewer/DummyBox";
import LoadingSpinner from "@/components/model-viewer/LoadingSpinner";
import { useModelLoader } from "@/components/model-viewer/hooks/useModelLoader";
import ModelPlaceholder from "./ModelPlaceholder";

interface ModelPreviewProps {
  modelUrl: string;
  fileName: string;
}

// This component will render the actual 3D model
const ModelContent = ({ modelUrl }: { modelUrl: string }) => {
  const { loading, model } = useModelLoader({ 
    modelSource: modelUrl, 
    onError: () => {} // We'll handle errors silently
  });
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return model ? (
    <primitive object={model} scale={1.5} />
  ) : null;
};

const ModelPreview: React.FC<ModelPreviewProps> = ({ modelUrl, fileName }) => {
  const [hasError, setHasError] = React.useState(false);

  // Handle errors silently by showing the placeholder
  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return <ModelPlaceholder fileName={fileName} />;
  }

  return (
    <div className="w-full h-full">
      <ErrorBoundary fallback={<ModelPlaceholder fileName={fileName} />} onError={handleError}>
        <Canvas shadows>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          
          <Suspense fallback={<LoadingSpinner />}>
            <ModelContent modelUrl={modelUrl} />
          </Suspense>
          
          <OrbitControls 
            autoRotate={true}
            autoRotateSpeed={4}
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
          />
          <Environment preset="sunset" />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

export default ModelPreview;
