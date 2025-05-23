
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// This is a public endpoint, no authentication needed
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get request body and signature header
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response("No signature header", { status: 400 });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Missing Stripe webhook secret");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
      return new Response(`Webhook Error: ${err instanceof Error ? err.message : String(err)}`, { status: 400 });
    }
    
    console.log(`Stripe event received: ${event.type}`);
    
    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Handle checkout session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const customerId = session.customer;
      const plan = session.metadata?.plan;
      
      if (!userId || !plan) {
        console.error("Missing user_id or plan in session metadata");
        return new Response("Missing metadata", { status: 400 });
      }
      
      console.log(`Updating user ${userId} with plan ${plan} and customer ${customerId}`);
      
      // Update user profile with Stripe customer ID and plan
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ 
          stripe_customer_id: customerId,
          plan: plan 
        })
        .eq("id", userId);
      
      if (error) {
        console.error(`Error updating profile: ${error.message}`);
        return new Response(`Error updating profile: ${error.message}`, { status: 500 });
      }
      
      // Reset usage tracking for the new subscription period
      await supabaseAdmin
        .from("usage_tracking")
        .upsert({
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          image_count: 0,
          model_count: 0
        });
    }
    
    // Handle subscription updated (e.g. plan changes or cancellations)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Determine the new plan based on the subscription item's price
      const priceId = subscription.items.data[0].price.id;
      
      // Map price IDs to plan names (you'll need to customize this based on your plans)
      const planMapping = {
        "price_1OYFJc2eZvKYlo2CHQudwJHN": "starter", // Replace with your actual price IDs
        "price_1OYFJc2eZvKYlo2CfMVXYHDN": "pro",
        "price_1OYFJc2eZvKYlo2CK1FCsrHN": "unlimited",
      };
      
      const plan = planMapping[priceId] || "free";
      
      // Find user by customer ID
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId);
      
      if (profileError || !profiles?.length) {
        console.error(`Error finding user for customer ${customerId}: ${profileError?.message || "Not found"}`);
        return new Response("User not found", { status: 404 });
      }
      
      const userId = profiles[0].id;
      
      // Update plan
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ plan })
        .eq("id", userId);
      
      if (error) {
        console.error(`Error updating profile plan: ${error.message}`);
        return new Response(`Error updating profile plan: ${error.message}`, { status: 500 });
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(`Server error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
});
