
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-STRIPE] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get request body and header
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response("No signature header", { status: 400 });
    }
    
    // Verify webhook with Stripe
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("STRIPE_WEBHOOK_SECRET is not set, skipping signature verification");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logStep(`Webhook signature verification failed`, { error: err instanceof Error ? err.message : String(err) });
      return new Response("Webhook signature verification failed", { status: 400 });
    }
    
    logStep("Webhook verified", { type: event.type });
    
    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        logStep("Checkout session completed", { sessionId: session.id });
        
        // Get metadata from the session
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        const commercialLicense = session.metadata?.commercialLicense === 'true';
        const additionalConversions = parseInt(session.metadata?.additionalConversions || '0', 10);
        
        if (!userId || !planType) {
          logStep("Missing metadata in checkout session", { userId, planType });
          return new Response("Missing metadata", { status: 400 });
        }
        
        // Get subscription ID from the session
        const subscriptionId = session.subscription;
        if (!subscriptionId) {
          logStep("No subscription ID in checkout session");
          return new Response("No subscription ID", { status: 400 });
        }
        
        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const validUntil = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Update subscription in database
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            commercial_license: commercialLicense,
            additional_conversions: additionalConversions,
            valid_until: validUntil,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (updateError) {
          logStep("Error updating subscription in database", { error: updateError.message });
          return new Response("Error updating subscription", { status: 500 });
        }
        
        logStep("Subscription updated in database", {
          userId,
          planType,
          validUntil
        });
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });
        
        // Get customer ID
        const customerId = subscription.customer;
        
        // Find user by customer ID
        const { data: userData, error: userError } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (userError || !userData) {
          logStep("Could not find user for customer", { customerId, error: userError?.message });
          return new Response("User not found", { status: 404 });
        }
        
        // Update subscription status
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const validUntil = isActive ? new Date(subscription.current_period_end * 1000).toISOString() : null;
        
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            valid_until: validUntil,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userData.user_id);
        
        if (updateError) {
          logStep("Error updating subscription status", { error: updateError.message });
          return new Response("Error updating subscription status", { status: 500 });
        }
        
        logStep("Subscription status updated", {
          userId: userData.user_id,
          isActive,
          validUntil
        });
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        logStep("Subscription deleted", { subscriptionId: subscription.id });
        
        // Get customer ID
        const customerId = subscription.customer;
        
        // Find user by customer ID
        const { data: userData, error: userError } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (userError || !userData) {
          logStep("Could not find user for customer", { customerId, error: userError?.message });
          return new Response("User not found", { status: 404 });
        }
        
        // Downgrade to free plan
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_type: 'free',
            stripe_subscription_id: null,
            valid_until: null,
            commercial_license: false,
            additional_conversions: 0,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userData.user_id);
        
        if (updateError) {
          logStep("Error downgrading to free plan", { error: updateError.message });
          return new Response("Error downgrading subscription", { status: 500 });
        }
        
        logStep("Downgraded to free plan", { userId: userData.user_id });
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[WEBHOOK-STRIPE] Error: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
