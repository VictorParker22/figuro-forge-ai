
import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import ModelPlaceholder from './ModelPlaceholder';

interface ModelPreviewProps {
  modelUrl: string;
  fileName: string;
  onError?: () => void;
}

const LoadingSpinner = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-figuro-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

const Model = ({ url, onError }: { url: string; onError?: () => void }) => {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      (gltf) => {
        setModel(gltf.scene);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        if (onError) onError();
        setIsLoading(false);
      }
    );
    
    return () => {
      if (model) {
        model.traverse((child: any) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((material: any) => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
  }, [url, onError]);
  
  if (isLoading) return null;
  
  if (!model) return null;
  
  return (
    <primitive 
      object={model} 
      scale={[1.5, 1.5, 1.5]}
      position={[0, 0, 0]}
    />
  );
};

const ModelPreview: React.FC<ModelPreviewProps> = ({ modelUrl, fileName, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };
  
  useEffect(() => {
    // Set a loading timeout
    timerRef.current = window.setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  
  if (error) {
    return <ModelPlaceholder fileName={fileName} />;
  }
  
  return (
    <div className="relative w-full h-full">
      {loading && <LoadingSpinner />}
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <Model url={modelUrl} onError={handleError} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          autoRotate 
          autoRotateSpeed={3} 
        />
      </Canvas>
    </div>
  );
};

export default ModelPreview;
