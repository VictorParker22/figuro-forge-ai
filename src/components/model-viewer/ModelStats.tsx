import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ModelStatsProps {
  topology?: string;
  faces?: number;
  vertices?: number;
  isLoading?: boolean;
}

const ModelStats: React.FC<ModelStatsProps> = ({ 
  topology = "Quad", 
  faces = 0, 
  vertices = 0,
  isLoading = false
}) => {
  return (
    <Card className="bg-black/50 border-white/10 absolute top-4 left-4 z-10 w-auto">
      <CardContent className="p-3 text-xs">
        <div className="grid grid-cols-1 gap-1">
          <div className="flex justify-between">
            <span className="text-white/70">Topology</span>
            <span className="text-white font-medium">
              {isLoading ? (
                <span className="inline-block w-12 h-3 bg-white/10 animate-pulse rounded"></span>
              ) : topology}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Faces</span>
            <span className="text-white font-medium">
              {isLoading ? (
                <span className="inline-block w-16 h-3 bg-white/10 animate-pulse rounded"></span>
              ) : faces.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Vertices</span>
            <span className="text-white font-medium">
              {isLoading ? (
                <span className="inline-block w-16 h-3 bg-white/10 animate-pulse rounded"></span>
              ) : vertices.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelStats;