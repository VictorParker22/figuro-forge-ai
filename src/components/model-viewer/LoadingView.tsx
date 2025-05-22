
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface LoadingViewProps {
  progress?: number;
}

const LoadingView = ({ progress = 0 }: LoadingViewProps) => {
  return (
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
  );
};

export default LoadingView;
