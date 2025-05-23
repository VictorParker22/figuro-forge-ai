
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

export const PlanOptions = () => {
  const { subscription, isLoading, subscribeToPlan, openCustomerPortal } = useSubscription();
  const [processingPlan, setProcessingPlan] = React.useState<string | null>(null);
  
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Basic access to get started',
      features: [
        '3 Image generations per month',
        '1 3D Model conversion per month',
        'Personal use license',
        'Access to basic gallery',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 12.99,
      description: 'Perfect for hobbyists',
      features: [
        '20 Image generations per month',
        '5 3D Model conversions per month',
        'Personal use license',
        'Access to full gallery',
        'Priority support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      description: 'For serious creators',
      features: [
        '100 Image generations per month',
        '20 3D Model conversions per month',
        'Personal use license',
        'Access to exclusive models',
        'Advanced controls',
        '24/7 Priority support',
      ],
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      price: 59.99,
      description: 'For professionals',
      features: [
        'Unlimited Image generations',
        'Unlimited 3D Model conversions',
        'Commercial use license included',
        'Access to all premium content',
        'Advanced controls and customization',
        'Dedicated support team',
      ],
    },
  ];

  const handlePlanAction = async (planId) => {
    try {
      if (!subscription?.user) {
        toast({
          title: "Login Required",
          description: "Please sign in or create an account to subscribe.",
          variant: "destructive"
        });
        return;
      }

      setProcessingPlan(planId);
      
      if (subscription?.plan === planId) {
        // If it's the current plan, open the customer portal
        await openCustomerPortal();
      } else if (planId === 'free' || subscription?.plan === 'free') {
        // For upgrading from free or downgrading to free
        await subscribeToPlan(planId);
      } else {
        // For switching between paid plans
        await openCustomerPortal();
      }
    } catch (error) {
      console.error("Error handling plan action:", error);
      toast({
        title: "Error",
        description: "There was a problem processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  // Function to determine button text
  const getButtonText = (planId) => {
    if (subscription?.plan === planId) {
      return "Current Plan";
    }
    if (isPlanUpgrade(planId)) {
      return "Upgrade";
    }
    return "Downgrade";
  };

  // Function to check if switching to this plan would be an upgrade
  const isPlanUpgrade = (planId) => {
    const planOrder = ['free', 'starter', 'pro', 'unlimited'];
    const currentIndex = planOrder.indexOf(subscription?.plan || 'free');
    const targetIndex = planOrder.indexOf(planId);
    return targetIndex > currentIndex;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-figuro-darker/30 border-white/10 h-96">
            <CardHeader>
              <div className="h-7 bg-figuro-darker rounded w-1/3 mb-2"></div>
              <div className="h-5 bg-figuro-darker rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-figuro-darker rounded w-full"></div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-figuro-darker rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Plan Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id;
          const isProcessing = processingPlan === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`bg-figuro-darker/50 border-white/10 ${isCurrentPlan ? 'ring-2 ring-figuro-accent' : ''}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrentPlan && (
                    <span className="bg-figuro-accent text-white text-xs px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {plan.price === 0 ? 'Free' : `$${plan.price}/month`}
                </CardDescription>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-figuro-accent mr-2 flex-shrink-0" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${isCurrentPlan 
                    ? 'bg-figuro-darker text-white hover:bg-figuro-darker/80' 
                    : isPlanUpgrade(plan.id)
                      ? 'bg-figuro-accent hover:bg-figuro-accent-hover' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  onClick={() => handlePlanAction(plan.id)}
                  disabled={isCurrentPlan || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    getButtonText(plan.id)
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
