
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";

interface ModelViewerProps {
  modelUrl: string | null;
  isLoading: boolean;
}

const DummyBox = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#9b87f5" />
  </mesh>
);

const ModelViewer = ({ modelUrl, isLoading }: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  if (!modelUrl && !isLoading) {
    return null;
  }

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
        <Button 
          variant="outline" 
          size="sm" 
          className="border-white/10 hover:border-white/30"
          onClick={() => setAutoRotate(!autoRotate)}
        >
          {autoRotate ? "Stop Rotation" : "Auto Rotate"}
        </Button>
      </div>

      <div className="h-[400px]">
        {isLoading ? (
          <div className="w-full h-full p-4 flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-lg bg-white/5 loading-shine" />
          </div>
        ) : (
          <Canvas shadows dpr={[1, 2]}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <DummyBox />
            <OrbitControls 
              autoRotate={autoRotate}
              autoRotateSpeed={2}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
          </Canvas>
        )}
      </div>
      
      <div className="p-4 flex justify-center">
        <Button
          className="w-full bg-figuro-accent hover:bg-figuro-accent-hover flex items-center gap-2"
          disabled={!modelUrl || isLoading}
        >
          <Download size={16} />
          Download 3D Model
        </Button>
      </div>
    </motion.div>
  );
};

export default ModelViewer;
