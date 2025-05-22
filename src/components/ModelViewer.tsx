import React, { useRef, useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  useGLTF, 
  Environment,
  Center,
  Html
} from "@react-three/drei";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as THREE from "three";
import { useToast } from "@/hooks/use-toast";
import { addCorsProxy, tryLoadWithCorsProxies } from "@/utils/corsProxy";

interface ModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
  progress?: number;
  errorMessage?: string | null;
}

// This component displays a loading spinner inside the 3D canvas
const LoadingSpinner = () => (
  <Html center>
    <div className="flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/20 border-t-figuro-accent rounded-full animate-spin"></div>
      <p className="mt-4 text-white text-sm">Loading model...</p>
    </div>
  </Html>
);

// This component will load and display the actual 3D model
const Model = ({ url, onError }: { url: string; onError: (error: any) => void }) => {
  const [modelUrl, setModelUrl] = useState(url);
  const [proxyAttempts, setProxyAttempts] = useState(0);
  const [isUsingProxy, setIsUsingProxy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // First try with the original URL, then try with proxies if that fails
    tryLoadWithCorsProxies(
      url,
      (loadedUrl) => {
        setModelUrl(loadedUrl);
        setIsUsingProxy(loadedUrl !== url);
        if (loadedUrl !== url) {
          console.log(`Successfully loaded model using CORS proxy: ${loadedUrl !== url ? 'Yes' : 'No'}`);
        }
      },
      (error) => {
        console.error("All loading attempts failed:", error);
        onError(error);
      }
    );
  }, [url, onError]);

  try {
    // Set a timeout for the model loading
    const { scene } = useGLTF(modelUrl, undefined, undefined, (error) => {
      console.error("Error loading 3D model:", error);
      
      // If we failed but haven't tried proxies yet, try with a proxy now
      if (proxyAttempts < 2 && !isUsingProxy) {
        const nextProxyIndex = proxyAttempts;
        const proxiedUrl = addCorsProxy(url, nextProxyIndex);
        console.log(`Trying with proxy ${nextProxyIndex}:`, proxiedUrl);
        
        setProxyAttempts(prev => prev + 1);
        setModelUrl(proxiedUrl);
        setIsUsingProxy(true);
      } else {
        // We've tried everything, pass the error up
        onError(error);
      }
    });
    
    useEffect(() => {
      // Apply better materials and lighting settings
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            // Enhance materials if needed
            const material = mesh.material as THREE.MeshStandardMaterial;
            if (material.map) material.map.anisotropy = 16;
          }
        }
      });
      
      return () => {
        try {
          // Clean up to avoid memory leaks
          useGLTF.preload(modelUrl);
        } catch (e) {
          console.log("Cleanup error:", e);
        }
      };
    }, [modelUrl, scene]);

    return (
      <Center scale={[1.5, 1.5, 1.5]}>
        <primitive object={scene} />
      </Center>
    );
  } catch (error) {
    // Handle any errors in model loading
    console.error("Error in Model component:", error);
    onError(error);
    
    // Return an empty fragment
    return null;
  }
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
  const [modelLoadAttempted, setModelLoadAttempted] = useState(false);
  const { toast } = useToast();
  // Keep track of original URL for downloads
  const originalUrlRef = useRef<string | null>(modelUrl);

  // Reset error state when modelUrl changes
  useEffect(() => {
    if (modelUrl) {
      setModelError(null);
      setModelLoadAttempted(false);
      originalUrlRef.current = modelUrl;
    }
  }, [modelUrl]);

  if (!modelUrl && !isLoading) {
    return null;
  }

  const handleDownload = () => {
    if (!originalUrlRef.current) return;
    
    try {
      // Always use the original URL for downloads, not the proxied version
      const downloadUrl = originalUrlRef.current;
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `figurine-model-${new Date().getTime()}.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your 3D model download has started."
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the model. Try again or check console for details.",
        variant: "destructive"
      });
    }
  };

  const handleModelError = (error: any) => {
    console.error("Error loading 3D model:", error);
    
    let errorMsg = "Failed to load 3D model. The download may still work.";
    
    // Check for specific CORS or network errors
    if (error.message) {
      if (error.message.includes("Failed to fetch")) {
        errorMsg = "Network error loading 3D model. The model URL might be restricted by CORS policy. Try the download button instead.";
      } else if (error.message.includes("Cross-Origin")) {
        errorMsg = "CORS policy prevented loading the 3D model. Try the download button instead.";
      }
    }
    
    setModelError(errorMsg);
    setModelLoadAttempted(true);
  };

  // Determine if we should show an error message
  // Only show error if we don't have a model URL or we tried to load the model and failed
  const shouldShowError = (errorMessage || modelError) && (!modelUrl || (modelLoadAttempted && modelError));

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

      <div className="h-[400px] relative">
        {isLoading ? (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center">
            <Skeleton className="w-full h-full rounded-lg bg-white/5 loading-shine" />
            {progress > 0 && (
              <div className="w-full mt-4 px-4 absolute bottom-4 left-0 right-0">
                <Progress 
                  value={progress} 
                  className="h-2 bg-white/10" 
                />
                <p className="text-center text-sm text-white/70 mt-2">
                  {progress < 100 ? `Converting: ${progress}%` : "Finalizing model..."}
                </p>
              </div>
            )}
          </div>
        ) : shouldShowError ? (
          <div className="w-full h-full p-4 flex items-center justify-center text-center">
            <div className="text-red-400">
              <p>{errorMessage || modelError}</p>
              {modelUrl && (
                <p className="text-sm text-green-400 mt-2">
                  A model URL was received. Try downloading it using the button below.
                </p>
              )}
              {!modelUrl && (
                <p className="text-sm text-white/50 mt-2">Try converting the image again</p>
              )}
            </div>
          </div>
        ) : (
          <Canvas shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            
            <Suspense fallback={<LoadingSpinner />}>
              {modelUrl ? (
                <ErrorBoundary 
                  fallback={<DummyBox />} 
                  onError={handleModelError}
                >
                  <Model url={modelUrl} onError={handleModelError} />
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
        )}
      </div>
      
      <div className="p-4 flex justify-center">
        <Button
          className="w-full bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
          disabled={!modelUrl}
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
