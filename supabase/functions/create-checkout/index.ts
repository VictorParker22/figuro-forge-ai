
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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");
    
    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Get request body
    const requestData = await req.json();
    const { planType, addOns } = requestData;
    logStep("Request data", { planType, addOns });
    
    // Authenticate user from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });
    
    // Create a Supabase client with service role key to query plan details
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Get plan details from the database
    const { data: planData, error: planError } = await supabaseAdmin
      .from("plan_limits")
      .select("*")
      .eq("plan_type", planType)
      .single();
    
    if (planError || !planData) {
      throw new Error(`Failed to fetch plan details: ${planError?.message || "Plan not found"}`);
    }
    logStep("Plan fetched", planData);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if a Stripe customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create a new customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }
    
    // Build line items based on plan and add-ons
    const lineItems = [];
    
    // Add main subscription plan
    if (planType !== 'free') {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Figuro.AI ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
            description: `${planData.image_generations_limit} image generations and ${planData.model_conversions_limit} 3D model conversions per month`
          },
          unit_amount: planData.price_monthly,
          recurring: {
            interval: "month"
          }
        },
        quantity: 1
      });
    }
    
    // Add commercial license if selected
    if (addOns?.commercialLicense) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Commercial License",
            description: "Resell and commercial use of generated models"
          },
          unit_amount: 1000, // $10
          recurring: {
            interval: "month"
          }
        },
        quantity: 1
      });
    }
    
    // Add additional conversions if selected
    if (addOns?.additionalConversions) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Additional 10 3D Model Conversions",
            description: "10 extra 3D model conversions per month"
          },
          unit_amount: 500, // $5
          recurring: {
            interval: "month"
          }
        },
        quantity: addOns.additionalConversions
      });
    }
    
    // For free plan, return success without creating a checkout session
    if (planType === 'free') {
      // Use the service role key for admin operations
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      
      // Insert or update subscription record for free plan
      const { error: subscriptionError } = await adminClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_type: "free",
          commercial_license: false,
          additional_conversions: 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (subscriptionError) {
        throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
      }
      
      // Create or update user_usage record
      const { error: usageError } = await adminClient
        .from("user_usage")
        .upsert({
          user_id: user.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (usageError) {
        throw new Error(`Failed to update usage: ${usageError.message}`);
      }
      
      return new Response(JSON.stringify({ success: true, message: "Subscribed to free plan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planType: planType,
        commercialLicense: addOns?.commercialLicense ? "true" : "false",
        additionalConversions: addOns?.additionalConversions?.toString() || "0"
      }
    });
    
    logStep("Checkout session created", { sessionId: session.id, url: session.url });
    
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[CREATE-CHECKOUT] Error: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
