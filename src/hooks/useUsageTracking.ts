
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

interface UsageLimits {
  images: number;
  models: number;
}

// Define plan limits
const PLAN_LIMITS: Record<string, UsageLimits> = {
  "free": { images: 3, models: 1 },
  "starter": { images: 20, models: 5 },
  "pro": { images: 100, models: 20 },
  "unlimited": { images: Infinity, models: Infinity },
};

export const useUsageTracking = () => {
  const { user, profile } = useAuth();
  const [usage, setUsage] = useState<{ image_count: number; model_count: number } | null>(null);
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Get current usage and limits
  useEffect(() => {
    const fetchUsageAndLimits = async () => {
      if (!user) {
        setUsage(null);
        setLimits(null);
        setIsLoading(false);
        return;
      }
      
      try {
        // Get plan from profile
        const planType = profile?.plan || "free";
        
        // Get today's usage
        const { data, error } = await supabase
          .from("usage_tracking")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .single();
        
        if (error && error.code !== "PGRST116") { // PGRST116 is record not found
          throw error;
        }
        
        // If no usage record, create one
        if (!data) {
          const { data: newRecord, error: insertError } = await supabase
            .from("usage_tracking")
            .insert({
              user_id: user.id,
              date: today,
              image_count: 0,
              model_count: 0
            })
            .select()
            .single();
          
          if (insertError) throw insertError;
          setUsage(newRecord);
        } else {
          setUsage(data);
        }
        
        // Set limits based on user's plan
        setLimits(PLAN_LIMITS[planType] || PLAN_LIMITS.free);
      } catch (error) {
        console.error("Error fetching usage:", error);
        toast({
          title: "Error",
          description: "Failed to fetch usage data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsageAndLimits();
  }, [user, profile, today]);
  
  // Check if user can perform action
  const canPerformAction = (actionType: "image_generation" | "model_conversion") => {
    if (!user || !usage || !limits) return false;
    
    if (actionType === "image_generation") {
      return usage.image_count < limits.images;
    } else {
      return usage.model_count < limits.models;
    }
  };
  
  // Track usage of an action
  const trackAction = async (actionType: "image_generation" | "model_conversion") => {
    if (!user || !usage) return false;
    
    // Check if user can perform action
    if (!canPerformAction(actionType)) {
      return false;
    }
    
    try {
      const updateData = actionType === "image_generation"
        ? { image_count: usage.image_count + 1 }
        : { model_count: usage.model_count + 1 };
      
      const { data, error } = await supabase
        .from("usage_tracking")
        .update(updateData)
        .eq("user_id", user.id)
        .eq("date", today)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setUsage(data);
      return true;
    } catch (error) {
      console.error("Error tracking usage:", error);
      toast({
        title: "Error",
        description: "Failed to track usage",
        variant: "destructive",
      });
      return false;
    }
  };
  
  return {
    usage,
    limits,
    isLoading,
    canPerformAction,
    trackAction,
  };
};
