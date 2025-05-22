
import React, { useState, useEffect, useRef } from "react";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "./LoadingSpinner";

interface Model3DProps {
  modelSource: string | Blob | null;
  onError: (error: any) => void;
}

const Model3D = ({ modelSource, onError }: Model3DProps) => {
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const { toast } = useToast();
  
  // Refs to track resources and prevent memory leaks
  const loaderRef = useRef<GLTFLoader | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const controllerRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("Model3D: Effect triggered with source:", 
      typeof modelSource === 'string' ? modelSource : 'Blob object');
    
    // Don't attempt to load if no source is provided
    if (!modelSource) {
      console.log("No model source provided, skipping load");
      return;
    }
    
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
        let modelUrl: string;
        
        // Handle different source types
        if (typeof modelSource === 'string') {
          // It's a URL string
          modelUrl = modelSource;
          console.log("Loading from URL string:", modelUrl);
        } else {
          // It's a Blob object, create an object URL
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
          
          objectUrlRef.current = URL.createObjectURL(modelSource);
          modelUrl = objectUrlRef.current;
          console.log("Created and loading from object URL:", modelUrl);
        }
        
        // Load the model
        const loadWithUrl = (url: string) => {
          return new Promise<THREE.Group>((resolve, reject) => {
            loader.load(
              url,
              (gltf) => {
                if (controllerRef.current?.signal.aborted) {
                  console.log("Load operation was aborted");
                  reject(new Error("Load operation aborted"));
                  return;
                }
                console.log("Model loaded successfully from:", url);
                resolve(gltf.scene);
              },
              (progress) => {
                if (!controllerRef.current?.signal.aborted) {
                  console.log(`Loading progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
                }
              },
              (error) => {
                if (controllerRef.current?.signal.aborted) return;
                console.error("Error loading model:", error);
                reject(error);
              }
            );
          });
        };
        
        try {
          // Try direct loading
          const scene = await loadWithUrl(modelUrl);
          setModel(scene);
          setLoading(false);
          isLoadingRef.current = false;
          toast({
            title: "Model loaded",
            description: "3D model loaded successfully",
          });
        } catch (directError) {
          if (controllerRef.current?.signal.aborted) return;
          
          // If it's a string URL and not a blob URL, try with CORS proxy
          if (typeof modelSource === 'string' && !modelSource.startsWith('blob:')) {
            try {
              const proxyUrl = `https://cors-proxy.fringe.zone/${encodeURIComponent(modelSource)}`;
              console.log("Trying with CORS proxy:", proxyUrl);
              
              const scene = await loadWithUrl(proxyUrl);
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
          } else {
            // For blob URLs, just report the error
            console.error("Failed to load from blob URL:", directError);
            onError(directError);
            setLoading(false);
            isLoadingRef.current = false;
            toast({
              title: "Loading failed",
              description: "Failed to load the 3D model. The file might be corrupted.",
              variant: "destructive",
            });
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
      
      // Revoke object URL if we created one
      if (objectUrlRef.current) {
        try {
          URL.revokeObjectURL(objectUrlRef.current);
          console.log("Revoked object URL:", objectUrlRef.current);
          objectUrlRef.current = null;
        } catch (error) {
          console.error("Error revoking object URL:", error);
        }
      }
      
      isLoadingRef.current = false;
      loaderRef.current = null;
    };
  }, [modelSource, onError, toast, model]);
  
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
