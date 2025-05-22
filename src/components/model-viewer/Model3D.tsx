
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
    // Don't attempt to load if no URL is provided
    if (!url) return;
    
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
    
    // Create loader instance
    const loader = new GLTFLoader();
    loaderRef.current = loader;
    
    // Cleanup function to be called when component unmounts or URL changes
    const cleanup = () => {
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
      isLoadingRef.current = false;
    };
    
    const loadModel = async () => {
      try {
        // For blob URLs
        if (url.startsWith('blob:')) {
          console.log("Loading blob URL:", url);
          
          try {
            loader.load(
              url,
              (gltf) => {
                if (controllerRef.current?.signal.aborted) {
                  console.log("Load operation was aborted");
                  return;
                }
                
                console.log("Blob URL model loaded successfully");
                setModel(gltf.scene);
                setLoading(false);
                isLoadingRef.current = false;
                toast({
                  title: "Model loaded",
                  description: "Custom 3D model loaded successfully",
                });
              },
              // Progress callback
              (progress) => {
                if (!controllerRef.current?.signal.aborted) {
                  console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                }
              },
              // Error callback
              (error) => {
                if (controllerRef.current?.signal.aborted) return;
                
                console.error("Error loading blob URL model:", error);
                onError(error);
                setLoading(false);
                isLoadingRef.current = false;
              }
            );
          } catch (error) {
            console.error("Error setting up blob URL model loader:", error);
            onError(error);
            setLoading(false);
            isLoadingRef.current = false;
          }
        } else {
          // For remote URLs, try direct first then fallback to proxy
          try {
            console.log("Loading remote URL:", url);
            
            // First attempt: Direct loading
            loader.load(
              url,
              (gltf) => {
                if (controllerRef.current?.signal.aborted) return;
                
                console.log("Model loaded successfully");
                setModel(gltf.scene);
                setLoading(false);
                isLoadingRef.current = false;
                toast({
                  title: "Model loaded",
                  description: "3D model loaded successfully",
                });
              },
              // Progress callback
              (progress) => {
                if (!controllerRef.current?.signal.aborted) {
                  console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                }
              },
              // Error callback
              (error) => {
                if (controllerRef.current?.signal.aborted) return;
                
                console.error("Direct loading failed:", error);
                
                // Second attempt: Try with CORS proxy
                const proxyUrl = `https://cors-proxy.fringe.zone/${encodeURIComponent(url)}`;
                console.log("Trying with CORS proxy:", proxyUrl);
                
                loader.load(
                  proxyUrl,
                  (gltf) => {
                    if (controllerRef.current?.signal.aborted) return;
                    
                    console.log("Model loaded successfully with proxy");
                    setModel(gltf.scene);
                    setLoading(false);
                    isLoadingRef.current = false;
                    toast({
                      title: "Model loaded",
                      description: "3D model loaded successfully using proxy",
                    });
                  },
                  (progress) => {
                    if (!controllerRef.current?.signal.aborted) {
                      console.log(`Proxy loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                    }
                  },
                  (proxyError) => {
                    if (controllerRef.current?.signal.aborted) return;
                    
                    console.error("Proxy loading failed:", proxyError);
                    onError(proxyError);
                    setLoading(false);
                    isLoadingRef.current = false;
                    toast({
                      title: "Loading failed",
                      description: "Failed to load the 3D model. Please try downloading it instead.",
                      variant: "destructive",
                    });
                  }
                );
              }
            );
          } catch (error) {
            console.error("Error in model loading process:", error);
            onError(error);
            setLoading(false);
            isLoadingRef.current = false;
          }
        }
      } catch (error) {
        console.error("Unexpected error in model loading:", error);
        onError(error);
        setLoading(false);
        isLoadingRef.current = false;
      }
    };
    
    loadModel();
    
    return () => {
      // Cleanup when component unmounts or URL changes
      console.log("Cleaning up model loader");
      cleanup();
      
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      
      // Revoke blob URL if it was created in this component
      if (url.startsWith('blob:') && !url.includes('model-viewer')) {
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
