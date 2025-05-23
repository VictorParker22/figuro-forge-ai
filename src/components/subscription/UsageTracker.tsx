
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useUsageTracking } from "@/hooks/useUsageTracking";

export const UsageTracker = () => {
  const { usage, limits, isLoading } = useUsageTracking();
  
  if (isLoading || !usage || !limits) {
    return (
      <Card className="bg-figuro-darker/50 border-white/10 mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse flex flex-col gap-4 w-full">
            <div className="h-5 bg-figuro-darker rounded w-2/3"></div>
            <div className="h-4 bg-figuro-darker rounded w-full"></div>
            <div className="h-5 bg-figuro-darker rounded w-2/3 mt-4"></div>
            <div className="h-4 bg-figuro-darker rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const imageUsagePercentage = limits.images === Infinity 
    ? 0 
    : Math.min(100, (usage.image_count / limits.images) * 100);
  
  const modelUsagePercentage = limits.models === Infinity 
    ? 0 
    : Math.min(100, (usage.model_count / limits.models) * 100);

  const isImageNearLimit = imageUsagePercentage >= 80;
  const isModelNearLimit = modelUsagePercentage >= 80;

  return (
    <Card className="bg-figuro-darker/50 border-white/10 mb-6">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Your Usage</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-white">
                Image Generations
                {isImageNearLimit && !isNaN(imageUsagePercentage) && imageUsagePercentage < 100 && (
                  <span className="ml-2 text-amber-400 font-medium flex items-center text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Almost at limit
                  </span>
                )}
              </p>
              <span className="text-white/70">
                {usage.image_count} / {limits.images === Infinity ? '∞' : limits.images}
              </span>
            </div>
            <Progress 
              value={isNaN(imageUsagePercentage) ? 0 : imageUsagePercentage} 
              className="h-2 bg-white/10" 
              indicatorClassName={imageUsagePercentage >= 100 
                ? "bg-red-500" 
                : isImageNearLimit 
                  ? "bg-amber-500" 
                  : "bg-figuro-accent"
              }
            />
            {imageUsagePercentage >= 100 && (
              <p className="text-red-400 text-sm mt-1">
                You've reached your limit. Please upgrade to continue generating images.
              </p>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-white">
                3D Model Conversions
                {isModelNearLimit && !isNaN(modelUsagePercentage) && modelUsagePercentage < 100 && (
                  <span className="ml-2 text-amber-400 font-medium flex items-center text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Almost at limit
                  </span>
                )}
              </p>
              <span className="text-white/70">
                {usage.model_count} / {limits.models === Infinity ? '∞' : limits.models}
              </span>
            </div>
            <Progress 
              value={isNaN(modelUsagePercentage) ? 0 : modelUsagePercentage} 
              className="h-2 bg-white/10" 
              indicatorClassName={modelUsagePercentage >= 100 
                ? "bg-red-500" 
                : isModelNearLimit 
                  ? "bg-amber-500" 
                  : "bg-figuro-accent"
              }
            />
            {modelUsagePercentage >= 100 && (
              <p className="text-red-400 text-sm mt-1">
                You've reached your limit. Please upgrade to continue converting models.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
