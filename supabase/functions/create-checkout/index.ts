
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the user from the authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Error getting user');
    }

    // Parse the request body
    const { plan, successUrl, cancelUrl } = await req.json();

    if (!plan) {
      throw new Error('No plan specified');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create product and price if they don't exist
    // This is a safer approach that will create products if they're missing
    // and return existing ones if they already exist
    async function getOrCreatePriceId(planName) {
      // First, check if we already have the product
      const products = await stripe.products.list({ active: true });
      const existingProduct = products.data.find(p => p.name.toLowerCase() === planName.toLowerCase());
      
      if (existingProduct && existingProduct.default_price) {
        // Return existing price ID
        return existingProduct.default_price.toString();
      }
      
      // Set up price details based on the plan
      let productDetails = {
        name: planName,
        description: `${planName} Plan`,
      };
      
      let priceDetails = {
        currency: 'usd',
        recurring: { interval: 'month' },
      };
      
      // Set price based on plan
      switch (planName.toLowerCase()) {
        case 'starter':
          priceDetails.unit_amount = 1299; // $12.99
          break;
        case 'pro':
          priceDetails.unit_amount = 2999; // $29.99
          break;
        case 'unlimited':
          priceDetails.unit_amount = 5999; // $59.99
          break;
        default:
          throw new Error(`Unknown plan: ${planName}`);
      }
      
      // Create the product
      const product = await stripe.products.create(productDetails);
      
      // Create the price
      const price = await stripe.prices.create({
        ...priceDetails,
        product: product.id,
      });
      
      return price.id;
    }

    // Get or create price ID for the requested plan
    const priceId = await getOrCreatePriceId(plan);

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${req.headers.get("origin")}/pricing?success=true`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: plan,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`Error creating checkout session: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
