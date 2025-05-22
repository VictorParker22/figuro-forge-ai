
import React, { useState, useEffect } from "react";
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

export default Model3D;
