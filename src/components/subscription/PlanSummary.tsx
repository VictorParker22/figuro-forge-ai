
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ExternalLink } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDate } from "@/lib/utils";

export const PlanSummary = () => {
  const { subscription, openCustomerPortal, isLoading } = useSubscription();
  
  // Get color based on plan type
  const getPlanColor = (plan: string | undefined): string => {
    switch (plan) {
      case 'pro':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'unlimited':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'starter':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleManagePlan = async () => {
    await openCustomerPortal();
  };

  if (isLoading) {
    return (
      <Card className="bg-figuro-darker/50 border-white/10 mb-6">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="animate-pulse flex flex-col gap-2 w-full">
            <div className="h-6 bg-figuro-darker rounded w-1/3"></div>
            <div className="h-4 bg-figuro-darker rounded w-2/3 mt-2"></div>
            <div className="h-4 bg-figuro-darker rounded w-1/2 mt-1"></div>
          </div>
          <div className="animate-pulse h-10 bg-figuro-darker rounded w-full sm:w-40"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-figuro-darker/50 border-white/10 mb-6">
      <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-white">Current Plan</h3>
            <Badge className={`${getPlanColor(subscription?.plan)} text-white capitalize`}>
              {subscription?.plan || "Free"}
            </Badge>
          </div>
          
          {subscription?.valid_until && (
            <p className="text-white/70 flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Renews on {formatDate(subscription.valid_until)}
            </p>
          )}
          
          {subscription?.commercial_license && (
            <Badge variant="outline" className="mt-2 text-yellow-400 border-yellow-400/30">
              Commercial License
            </Badge>
          )}
        </div>
        
        <Button 
          variant="outline" 
          className="border-white/20 text-white hover:bg-figuro-accent hover:text-white"
          onClick={handleManagePlan}
          disabled={subscription?.plan === 'free'}
        >
          {subscription?.plan === 'free' ? 'No Active Subscription' : 'Manage Plan'} 
          <ExternalLink className="ml-1 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
