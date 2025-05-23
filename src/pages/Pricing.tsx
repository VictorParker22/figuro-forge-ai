
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { pageSEO } from "@/config/seo";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const {
    subscription,
    isLoading,
    user,
    checkSubscription,
    subscribeToPlan,
    openCustomerPortal,
  } = useSubscription();
  const [commercialLicense, setCommercialLicense] = useState(false);
  const [additionalConversions, setAdditionalConversions] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if we have a successful payment
  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");
    
    if (success === "true" && sessionId) {
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated.",
      });
      
      // Remove query params
      navigate("/pricing", { replace: true });
      
      // Refresh subscription after a short delay to allow the webhook to process
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    }
    
    const canceled = searchParams.get("canceled");
    if (canceled === "true") {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription process was canceled.",
        variant: "destructive",
      });
      
      // Remove query params
      navigate("/pricing", { replace: true });
    }
  }, [searchParams, navigate, toast, checkSubscription]);

  // Handle plan selection and subscription
  const handleSelectPlan = (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPlan(planId);
    
    // If it's the free plan or the current plan, don't show confirmation dialog
    if (planId === "free" || (subscription && subscription.plan === planId)) {
      handleConfirmSubscription();
    } else {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    
    setConfirmDialogOpen(false);
    
    const addOns = {
      commercialLicense: commercialLicense,
      additionalConversions: additionalConversions,
    };
    
    // Subscribe to the selected plan
    await subscribeToPlan(selectedPlan as any, addOns);
  };

  const calculateTotalPrice = (basePriceInCents: number) => {
    let total = basePriceInCents;
    
    if (commercialLicense) {
      total += 1000; // $10 for commercial license
    }
    
    if (additionalConversions > 0) {
      total += additionalConversions * 500; // $5 per 10 additional conversions
    }
    
    return (total / 100).toFixed(2);
  };

  // Pricing plans data
  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Get started with basic figurine creation",
      features: [
        "3 image generations per month",
        "1 model conversion per month",
        "Basic art styles",
        "Standard resolution",
        "Community support",
      ],
      basePriceInCents: 0,
    },
    {
      id: "starter",
      name: "Starter",
      price: "$12",
      period: "per month",
      description: "For enthusiasts and hobbyists",
      features: [
        "100 image generations per month",
        "20 model conversions per month",
        "All art styles",
        "High resolution",
        "Priority support",
      ],
      basePriceInCents: 1200,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29",
      period: "per month",
      description: "For serious creators and artists",
      features: [
        "300 image generations per month",
        "60 model conversions per month",
        "Custom art styles",
        "Ultra high resolution",
        "Priority rendering",
        "Dedicated support",
      ],
      basePriceInCents: 2900,
    },
    {
      id: "unlimited",
      name: "Unlimited",
      price: "$59",
      period: "per month",
      description: "For professional studios and businesses",
      features: [
        "Unlimited image generations",
        "Unlimited model conversions (fair use policy)",
        "All art styles and custom requests",
        "Ultra high resolution",
        "Priority rendering",
        "Commercial usage available",
        "API access",
        "Dedicated account manager",
      ],
      basePriceInCents: 5900,
    },
  ];

  // Handle sign in
  const handleSignIn = () => {
    // In a real app, redirect to the login page
    toast({
      title: "Authentication Required",
      description: "Please sign in to subscribe to a premium plan",
    });
  };

  return (
    <div className="min-h-screen bg-figuro-dark">
      <SEO 
        title={pageSEO.pricing.title}
        description={pageSEO.pricing.description}
        keywords={pageSEO.pricing.keywords}
        ogType={pageSEO.pricing.ogType}
      />
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-gradient">Pricing Plans</h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Choose the perfect plan for your needs. All plans include access to our AI-powered figurine generation platform.
            </p>
          </motion.div>
          
          {subscription && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <div className="glass-panel rounded-xl p-6 max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                      Your Subscription: <span className="text-figuro-accent">{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/70">Image Generations:</span>
                        <span className="font-semibold text-white">{subscription.usage.image_generations_used} / {subscription.limits.image_generations_limit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/70">Model Conversions:</span>
                        <span className="font-semibold text-white">{subscription.usage.model_conversions_used} / {subscription.limits.model_conversions_limit}</span>
                      </div>
                    </div>
                    {subscription.commercial_license && (
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">Commercial License</span>
                      </div>
                    )}
                    {subscription.plan !== "free" && (
                      <p className="text-sm text-white/60">
                        Renews: {subscription.valid_until ? new Date(subscription.valid_until).toLocaleDateString() : "N/A"}
                      </p>
                    )}
                  </div>
                  {subscription.plan !== "free" && (
                    <Button 
                      onClick={openCustomerPortal}
                      variant="outline"
                      className="border-white/10 hover:border-white/30"
                    >
                      Manage Subscription
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner h-8 w-8 border-4 border-figuro-accent/50 border-t-figuro-accent rounded-full mx-auto animate-spin"></div>
              <p className="mt-4 text-white/70">Loading subscription details...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`glass-panel rounded-xl p-8 relative ${
                      subscription && subscription.plan === plan.id
                        ? "border-figuro-accent ring-1 ring-figuro-accent/50"
                        : "border-white/10"
                    }`}
                  >
                    {subscription && subscription.plan === plan.id && (
                      <div className="absolute -top-3 left-0 right-0 flex justify-center">
                        <span className="bg-figuro-accent text-black text-xs font-semibold px-3 py-1 rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-end mb-2">
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        <span className="text-white/70 ml-1">/{plan.period}</span>
                      </div>
                      <p className="text-white/70">{plan.description}</p>
                    </div>
                    
                    <ul className="mb-8 space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="mr-2 h-5 w-5 text-figuro-accent shrink-0" />
                          <span className="text-white/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${
                        subscription && subscription.plan === plan.id
                          ? "bg-green-600 hover:bg-green-700"
                          : plan.id === "pro" || plan.id === "unlimited"
                          ? "bg-figuro-accent hover:bg-figuro-accent-hover"
                          : ""
                      }`}
                      variant={
                        subscription && subscription.plan === plan.id
                          ? "default"
                          : plan.id === "pro" || plan.id === "unlimited"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={(subscription && subscription.plan === plan.id) || isLoading}
                    >
                      {subscription && subscription.plan === plan.id
                        ? "Current Plan"
                        : user
                        ? "Subscribe"
                        : "Sign In to Subscribe"}
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-16 max-w-4xl mx-auto"
              >
                <h2 className="text-2xl font-bold mb-6 text-gradient text-center">Add-ons & Feature Comparison</h2>
                
                <div className="glass-panel rounded-xl p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-white">Add-ons</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <h4 className="font-medium text-white">Commercial License</h4>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-white/50 ml-2" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Permission to use models commercially and resell</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <span className="text-white font-medium">+$10/month</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="commercial-license"
                              checked={commercialLicense}
                              disabled={!user || (subscription?.commercial_license)}
                              onCheckedChange={setCommercialLicense}
                            />
                            <Label htmlFor="commercial-license" className="text-white/70">
                              {subscription?.commercial_license ? "Included in your plan" : "Add commercial license"}
                            </Label>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <h4 className="font-medium text-white">Additional Conversions</h4>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-white/50 ml-2" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add 10 more 3D model conversions per month</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <span className="text-white font-medium">+$5 per 10 conversions</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={!user || additionalConversions <= 0}
                              onClick={() => setAdditionalConversions(Math.max(0, additionalConversions - 1))}
                            >
                              -
                            </Button>
                            <span className="text-white">{additionalConversions * 10} conversions</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={!user || additionalConversions >= 10}
                              onClick={() => setAdditionalConversions(additionalConversions + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-white">Features by Plan</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-white/70">Feature</TableHead>
                            <TableHead className="text-white/70 text-right">Free</TableHead>
                            <TableHead className="text-white/70 text-right">Paid Plans</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-white">Priority Rendering</TableCell>
                            <TableCell className="text-right">❌</TableCell>
                            <TableCell className="text-right">✅</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-white">Custom Art Styles</TableCell>
                            <TableCell className="text-right">❌</TableCell>
                            <TableCell className="text-right">✅</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-white">High Resolution</TableCell>
                            <TableCell className="text-right">❌</TableCell>
                            <TableCell className="text-right">✅</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-white">API Access</TableCell>
                            <TableCell className="text-right">❌</TableCell>
                            <TableCell className="text-right">Unlimited Only</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
          
          {!user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-12 text-center"
            >
              <p className="text-white/70 mb-4">You need to sign in to subscribe to a plan</p>
              <Button onClick={handleSignIn} className="bg-figuro-accent hover:bg-figuro-accent-hover">
                Sign In
              </Button>
            </motion.div>
          )}
        </div>
      </section>
      
      <section className="py-16 bg-gradient-to-b from-transparent to-figuro-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-panel rounded-xl p-8 md:p-12 max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gradient">Need a custom solution?</h2>
                <p className="text-white/70">
                  Contact our team for customized pricing and solutions tailored to your specific requirements.
                </p>
              </div>
              <Button className="whitespace-nowrap bg-figuro-accent hover:bg-figuro-accent-hover">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              You're about to subscribe to the {selectedPlan?.charAt(0).toUpperCase() + selectedPlan?.slice(1)} plan.
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="py-4">
              <p className="font-semibold text-lg mb-4">
                Total: ${calculateTotalPrice(plans.find(p => p.id === selectedPlan)?.basePriceInCents || 0)}/month
              </p>
              <div className="space-y-2">
                <p>• {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan</p>
                {commercialLicense && <p>• Commercial License (+$10/month)</p>}
                {additionalConversions > 0 && (
                  <p>• {additionalConversions * 10} Additional Conversions (+${(additionalConversions * 5).toFixed(2)}/month)</p>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                You'll be redirected to Stripe to complete your purchase.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubscription}>
              Subscribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Pricing;
