
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  useGLTF, 
  Environment,
  Center
} from "@react-three/drei";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
  progress?: number;
  errorMessage?: string | null;
}

// This component will load and display the actual 3D model
const Model = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);

  // Log any errors for debugging
  useEffect(() => {
    return () => {
      // Clean up to avoid memory leaks
      useGLTF.preload(url);
    };
  }, [url]);

  return (
    <Center scale={[1.5, 1.5, 1.5]}>
      <primitive object={scene} />
    </Center>
  );
};

// Fallback component shown when no model is available
const DummyBox = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#9b87f5" />
  </mesh>
);

const ModelViewer = ({ modelUrl, isLoading, progress = 0, errorMessage = null }: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  // Reset error state when modelUrl changes
  useEffect(() => {
    setModelError(null);
  }, [modelUrl]);

  if (!modelUrl && !isLoading) {
    return null;
  }

  const handleDownload = () => {
    if (!modelUrl) return;
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = modelUrl;
    a.download = `figurine-model-${new Date().getTime()}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleModelError = (error: any) => {
    console.error("Error loading 3D model:", error);
    setModelError("Failed to load 3D model. Please try again.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-panel rounded-xl overflow-hidden"
      ref={containerRef}
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-medium">3D Model Preview</h3>
        {modelUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/10 hover:border-white/30"
            onClick={() => setAutoRotate(!autoRotate)}
          >
            {autoRotate ? "Stop Rotation" : "Auto Rotate"}
          </Button>
        )}
      </div>

      <div className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center">
            <Skeleton className="w-full h-full rounded-lg bg-white/5 loading-shine" />
            {progress > 0 && (
              <div className="w-full mt-4 px-4">
                <Progress 
                  value={progress} 
                  className="h-2 bg-white/10" 
                  indicatorClassName="bg-figuro-accent" 
                />
                <p className="text-center text-sm text-white/70 mt-2">
                  {progress < 100 ? `Converting: ${progress}%` : "Finalizing model..."}
                </p>
              </div>
            )}
          </div>
        ) : errorMessage || modelError ? (
          <div className="w-full h-full p-4 flex items-center justify-center text-center">
            <div className="text-red-400">
              <p>{errorMessage || modelError}</p>
              <p className="text-sm text-white/50 mt-2">Try converting the image again</p>
            </div>
          </div>
        ) : (
          <Canvas shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            
            {modelUrl ? (
              // Wrap in error boundary
              <ErrorBoundary fallback={<DummyBox />} onError={handleModelError}>
                <Model url={modelUrl} />
              </ErrorBoundary>
            ) : (
              <DummyBox />
            )}
            
            <OrbitControls 
              autoRotate={autoRotate}
              autoRotateSpeed={2}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
            <Environment preset="sunset" />
          </Canvas>
        )}
      </div>
      
      <div className="p-4 flex justify-center">
        <Button
          className="w-full bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
          disabled={!modelUrl || isLoading}
          onClick={handleDownload}
        >
          <Download size={16} />
          Download 3D Model
        </Button>
      </div>
    </motion.div>
  );
};

// Simple error boundary for the 3D model
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError: (error: any) => void;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default ModelViewer;
