
import React from "react";
import { Html } from "@react-three/drei";

const LoadingSpinner = () => (
  <Html center>
    <div className="flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/20 border-t-figuro-accent rounded-full animate-spin"></div>
      <p className="mt-4 text-white text-sm">Loading model...</p>
    </div>
  </Html>
);

export default LoadingSpinner;
