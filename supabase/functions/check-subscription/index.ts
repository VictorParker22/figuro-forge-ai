
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Use the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });
    
    // Get current subscription from database
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    // Get usage data
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("user_usage")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    // Get plan limits
    const { data: allPlans, error: plansError } = await supabaseAdmin
      .from("plan_limits")
      .select("*");
    
    if (plansError) {
      throw new Error(`Failed to fetch plan limits: ${plansError.message}`);
    }
    
    // If no subscription found, user is on free plan
    if (!subscriptionData || subscriptionError) {
      logStep("No subscription found, using free plan");
      
      // Create free plan record if it doesn't exist
      await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_type: "free",
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      // Create usage record if it doesn't exist
      if (!usageData || usageError) {
        await supabaseAdmin
          .from("user_usage")
          .upsert({
            user_id: user.id,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
      
      // Find free plan limits
      const freePlan = allPlans.find(plan => plan.plan_type === 'free') || {
        image_generations_limit: 3,
        model_conversions_limit: 1
      };
      
      return new Response(JSON.stringify({
        plan: "free",
        commercial_license: false,
        additional_conversions: 0,
        usage: usageData || { 
          image_generations_used: 0, 
          model_conversions_used: 0 
        },
        limits: {
          image_generations_limit: freePlan.image_generations_limit,
          model_conversions_limit: freePlan.model_conversions_limit
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
    // For subscribed users, verify subscription with Stripe if they have stripe_subscription_id
    let currentPlan = subscriptionData.plan_type;
    let isActive = true;
    let validUntil = subscriptionData.valid_until;
    
    if (subscriptionData.stripe_subscription_id) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
      
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      
      try {
        // Get subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionData.stripe_subscription_id);
        logStep("Retrieved Stripe subscription", { 
          id: subscription.id,
          status: subscription.status 
        });
        
        isActive = subscription.status === 'active' || subscription.status === 'trialing';
        validUntil = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Update subscription in database if status changed
        if (isActive !== (subscriptionData.valid_until !== null) || 
            new Date(validUntil).getTime() !== new Date(subscriptionData.valid_until || "").getTime()) {
          
          await supabaseAdmin
            .from("subscriptions")
            .update({
              valid_until: isActive ? validUntil : null,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);
          
          logStep("Updated subscription in database", { 
            isActive, 
            validUntil 
          });
        }
        
        // If subscription is no longer active, downgrade to free plan
        if (!isActive && currentPlan !== 'free') {
          currentPlan = 'free';
          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan_type: 'free',
              commercial_license: false,
              additional_conversions: 0,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);
          
          logStep("Downgraded to free plan due to inactive subscription");
        }
      } catch (stripeError) {
        // If we can't retrieve the subscription, assume it's inactive
        logStep("Error retrieving Stripe subscription", { 
          error: stripeError instanceof Error ? stripeError.message : String(stripeError)
        });
        
        isActive = false;
        currentPlan = 'free';
        
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_type: 'free',
            valid_until: null,
            commercial_license: false,
            additional_conversions: 0,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id);
      }
    }
    
    // Create usage record if it doesn't exist
    if (!usageData || usageError) {
      await supabaseAdmin
        .from("user_usage")
        .upsert({
          user_id: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }
    
    // Get plan limits
    const currentPlanLimits = allPlans.find(plan => plan.plan_type === currentPlan) || {
      image_generations_limit: 3,
      model_conversions_limit: 1
    };
    
    logStep("Returning subscription data", { 
      plan: currentPlan,
      commercial_license: subscriptionData.commercial_license,
      additional_conversions: subscriptionData.additional_conversions,
      isActive
    });
    
    // Return subscription details
    return new Response(JSON.stringify({
      plan: currentPlan,
      commercial_license: subscriptionData.commercial_license,
      additional_conversions: subscriptionData.additional_conversions,
      is_active: isActive,
      valid_until: validUntil,
      usage: usageData || { 
        image_generations_used: 0, 
        model_conversions_used: 0 
      },
      limits: {
        image_generations_limit: currentPlanLimits.image_generations_limit,
        model_conversions_limit: currentPlanLimits.model_conversions_limit + 
          (subscriptionData.additional_conversions || 0)
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CHECK-SUBSCRIPTION] Error: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
