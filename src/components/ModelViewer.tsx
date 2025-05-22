import React, { useRef, useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment,
  Center,
  Html,
  useGLTF
} from "@react-three/drei";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as THREE from "three";
import { useToast } from "@/hooks/use-toast";
// Import GLTFLoader through drei's exposed version instead of directly from three.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
  progress?: number;
  errorMessage?: string | null;
  onCustomModelLoad?: (url: string) => void;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [model, setModel] = useState<THREE.Group | null>(null);
  
  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    console.log("Attempting to load model from URL:", url);
    
    // For blob URLs, we need special handling
    if (url.startsWith('blob:')) {
      try {
        const loader = new GLTFLoader();
        
        loader.load(
          url,
          (gltf) => {
            console.log("Blob URL model loaded successfully:", gltf);
            setModel(gltf.scene);
            setLoading(false);
            toast({
              title: "Model loaded",
              description: "Custom 3D model loaded successfully",
            });
          },
          // Progress callback
          (progress) => {
            console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
          },
          // Error callback
          (error) => {
            console.error("Error loading blob URL model:", error);
            onError(error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error setting up blob URL model loader:", error);
        onError(error);
        setLoading(false);
      }
      
      return () => {
        // Cleanup function for blob URLs
        if (model) {
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.geometry) mesh.geometry.dispose();
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach((material) => material.dispose());
                } else {
                  mesh.material.dispose();
                }
              }
            }
          });
        }
      };
    }
    
    // For remote URLs, use the original approach
    const loader = new GLTFLoader();
    
    // Try to load the model directly first
    loader.load(
      url,
      (gltf) => {
        console.log("Model loaded successfully:", gltf);
        setModel(gltf.scene);
        setLoading(false);
        toast({
          title: "Model loaded",
          description: "3D model loaded successfully",
        });
      },
      // Progress callback
      (progress) => {
        console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
      },
      // Error callback
      (error) => {
        console.error("Direct loading failed:", error);
        
        // If direct loading fails, try with a CORS proxy
        const proxyUrl = `https://cors-proxy.fringe.zone/${encodeURIComponent(url)}`;
        console.log("Trying with CORS proxy:", proxyUrl);
        
        loader.load(
          proxyUrl,
          (gltf) => {
            console.log("Model loaded successfully with proxy:", gltf);
            setModel(gltf.scene);
            setLoading(false);
            toast({
              title: "Model loaded",
              description: "3D model loaded successfully using proxy",
            });
          },
          (progress) => {
            console.log(`Proxy loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
          },
          (proxyError) => {
            console.error("Proxy loading failed:", proxyError);
            onError(proxyError);
            setLoading(false);
            toast({
              title: "Loading failed",
              description: "Failed to load the 3D model. Please try downloading it instead.",
              variant: "destructive",
            });
          }
        );
      }
    );
    
    return () => {
      // Cleanup function
      if (model) {
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => material.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [url, onError, toast]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return model ? (
    <Center scale={[1.5, 1.5, 1.5]}>
      <primitive object={model} />
    </Center>
  ) : null;
};

// Fallback component shown when no model is available
const DummyBox = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#9b87f5" />
  </mesh>
);

const ModelViewer = ({ 
  modelUrl, 
  isLoading, 
  progress = 0, 
  errorMessage = null,
  onCustomModelLoad
}: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLoadAttempted, setModelLoadAttempted] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // Keep track of original URL for downloads
  const originalUrlRef = useRef<string | null>(modelUrl);

  // Reset error state when modelUrl changes
  useEffect(() => {
    if (modelUrl) {
      setModelError(null);
      setModelLoadAttempted(false);
      originalUrlRef.current = modelUrl;
      // Reset custom model when a new model is provided
      setCustomModelUrl(null);
      setCustomFile(null);
    }
  }, [modelUrl]);

  // Handle file upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is a GLB format
    if (!file.name.toLowerCase().endsWith('.glb')) {
      toast({
        title: "Invalid file format",
        description: "Please select a GLB file",
        variant: "destructive",
      });
      return;
    }

    console.log("Selected file:", file.name, "size:", file.size);
    setCustomFile(file);
    
    // Create blob URL for the file
    const objectUrl = URL.createObjectURL(file);
    console.log("Created blob URL:", objectUrl);
    setCustomModelUrl(objectUrl);
    setModelError(null);
    setModelLoadAttempted(false);
    
    toast({
      title: "Custom model loaded",
      description: `${file.name} has been loaded successfully`,
    });
    
    // Call the callback if provided
    if (onCustomModelLoad) {
      onCustomModelLoad(objectUrl);
    }
  };

  if (!modelUrl && !customModelUrl && !isLoading) {
    return null;
  }

  const handleDownload = () => {
    const downloadUrl = customModelUrl || originalUrlRef.current;
    if (!downloadUrl) return;
    
    try {
      // If custom file exists, download it directly
      if (customFile) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = customFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // For generated models, use the original URL for downloads, not the proxied version
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `figurine-model-${new Date().getTime()}.glb`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
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
  const shouldShowError = (errorMessage || modelError) && 
    ((!modelUrl && !customModelUrl) || 
    (modelLoadAttempted && modelError));

  // Determine which URL to use for the 3D model - custom uploaded model takes priority
  const displayModelUrl = customModelUrl || modelUrl;

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
        <div className="flex space-x-2">
          {displayModelUrl && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/10 hover:border-white/30"
              onClick={() => setAutoRotate(!autoRotate)}
            >
              {autoRotate ? "Stop Rotation" : "Auto Rotate"}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 hover:border-white/30"
            onClick={handleUploadClick}
          >
            <Upload size={16} className="mr-1" />
            Upload Model
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".glb"
            className="hidden"
          />
        </div>
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
              {displayModelUrl && (
                <p className="text-sm text-green-400 mt-2">
                  A model URL was received. Try downloading it using the button below.
                </p>
              )}
              {!displayModelUrl && (
                <p className="text-sm text-white/50 mt-2">Try converting the image again or upload your own GLB file</p>
              )}
            </div>
          </div>
        ) : (
          <Canvas shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            
            <Suspense fallback={<LoadingSpinner />}>
              {displayModelUrl ? (
                <ErrorBoundary 
                  fallback={<DummyBox />} 
                  onError={handleModelError}
                >
                  <Model url={displayModelUrl} onError={handleModelError} />
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
          disabled={!displayModelUrl}
          onClick={handleDownload}
        >
          <Download size={16} />
          {customFile ? `Download ${customFile.name}` : "Download 3D Model"}
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
