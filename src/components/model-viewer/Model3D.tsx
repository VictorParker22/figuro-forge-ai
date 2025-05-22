
import React, { useState, useEffect, useRef } from "react";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "./LoadingSpinner";

interface Model3DProps {
  url: string;
  onError: (error: any) => void;
}

const Model3D = ({ url, onError }: Model3DProps) => {
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const { toast } = useToast();
  
  // Add refs to track active loaders and prevent duplicate loading
  const loaderRef = useRef<GLTFLoader | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const prevUrlRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log("Model3D: Effect triggered with URL:", url);
    
    // Don't attempt to load if no URL is provided
    if (!url) {
      console.log("No URL provided, skipping load");
      return;
    }
    
    // Prevent loading the same URL multiple times
    if (url === prevUrlRef.current && isLoadingRef.current) {
      console.log("Skipping duplicate load request for:", url);
      return;
    }
    
    console.log("Loading model from URL:", url);
    prevUrlRef.current = url;
    
    // Create new abort controller for this load operation
    if (controllerRef.current) {
      console.log("Aborting previous load operation");
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    
    // Set loading state
    setLoading(true);
    isLoadingRef.current = true;
    
    // Create a single loader instance
    const loader = new GLTFLoader();
    loaderRef.current = loader;
    
    const loadModel = async () => {
      try {
        // For blob URLs
        if (url.startsWith('blob:')) {
          console.log("Loading blob URL:", url);
          
          const loadBlob = () => {
            return new Promise<THREE.Group>((resolve, reject) => {
              loader.load(
                url,
                (gltf) => {
                  if (controllerRef.current?.signal.aborted) {
                    console.log("Load operation was aborted");
                    reject(new Error("Load operation aborted"));
                    return;
                  }
                  console.log("Blob URL model loaded successfully");
                  resolve(gltf.scene);
                },
                (progress) => {
                  if (!controllerRef.current?.signal.aborted) {
                    console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                  }
                },
                (error) => {
                  if (controllerRef.current?.signal.aborted) return;
                  console.error("Error loading blob URL model:", error);
                  reject(error);
                }
              );
            });
          };
          
          try {
            const scene = await loadBlob();
            setModel(scene);
            setLoading(false);
            isLoadingRef.current = false;
            toast({
              title: "Model loaded",
              description: "Custom 3D model loaded successfully",
            });
          } catch (error) {
            if (controllerRef.current?.signal.aborted) return;
            console.error("Error in blob loading process:", error);
            onError(error);
            setLoading(false);
            isLoadingRef.current = false;
          }
        } else {
          // For remote URLs, try direct first then fallback to proxy
          console.log("Loading remote URL:", url);
          
          const loadDirect = () => {
            return new Promise<THREE.Group>((resolve, reject) => {
              loader.load(
                url,
                (gltf) => {
                  if (controllerRef.current?.signal.aborted) {
                    console.log("Load operation was aborted");
                    reject(new Error("Load operation aborted"));
                    return;
                  }
                  console.log("Remote URL model loaded successfully");
                  resolve(gltf.scene);
                },
                (progress) => {
                  if (!controllerRef.current?.signal.aborted) {
                    console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                  }
                },
                (error) => {
                  if (controllerRef.current?.signal.aborted) return;
                  console.error("Direct loading failed:", error);
                  reject(error);
                }
              );
            });
          };
          
          const loadWithProxy = (proxyUrl: string) => {
            return new Promise<THREE.Group>((resolve, reject) => {
              loader.load(
                proxyUrl,
                (gltf) => {
                  if (controllerRef.current?.signal.aborted) return;
                  console.log("Model loaded successfully with proxy");
                  resolve(gltf.scene);
                },
                (progress) => {
                  if (!controllerRef.current?.signal.aborted) {
                    console.log(`Proxy loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                  }
                },
                (proxyError) => {
                  if (controllerRef.current?.signal.aborted) return;
                  console.error("Proxy loading failed:", proxyError);
                  reject(proxyError);
                }
              );
            });
          };
          
          try {
            // First try direct loading
            const scene = await loadDirect();
            setModel(scene);
            setLoading(false);
            isLoadingRef.current = false;
            toast({
              title: "Model loaded",
              description: "3D model loaded successfully",
            });
          } catch (directError) {
            if (controllerRef.current?.signal.aborted) return;
            
            // If direct loading fails, try with CORS proxy
            try {
              const proxyUrl = `https://cors-proxy.fringe.zone/${encodeURIComponent(url)}`;
              console.log("Trying with CORS proxy:", proxyUrl);
              
              const scene = await loadWithProxy(proxyUrl);
              setModel(scene);
              setLoading(false);
              isLoadingRef.current = false;
              toast({
                title: "Model loaded",
                description: "3D model loaded successfully using proxy",
              });
            } catch (proxyError) {
              if (controllerRef.current?.signal.aborted) return;
              console.error("All loading attempts failed");
              onError(proxyError || directError);
              setLoading(false);
              isLoadingRef.current = false;
              toast({
                title: "Loading failed",
                description: "Failed to load the 3D model. Please try downloading it instead.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        if (controllerRef.current?.signal.aborted) return;
        console.error("Unexpected error in model loading:", error);
        onError(error);
        setLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      console.log("Cleanup: Disposing model resources");
      
      // Abort any in-progress loads
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      
      // Clean up the model
      if (model) {
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) {
              console.log("Disposing geometry");
              mesh.geometry.dispose();
            }
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => {
                  console.log("Disposing material (array)");
                  material.dispose();
                });
              } else {
                console.log("Disposing material");
                mesh.material.dispose();
              }
            }
          }
        });
        
        // Remove all children to ensure proper cleanup
        while (model.children.length > 0) {
          const child = model.children[0];
          model.remove(child);
        }
      }
      
      isLoadingRef.current = false;
      loaderRef.current = null;
      
      // Revoke blob URL if it was created in this component
      if (url && url.startsWith('blob:') && !url.includes('model-viewer')) {
        try {
          URL.revokeObjectURL(url);
          console.log("Revoked blob URL:", url);
        } catch (error) {
          console.error("Error revoking blob URL:", error);
        }
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

export default Model3D;
