import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request
    const { inc_amount = 1, column_name, table_name, id, id_column = 'id' } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    // If table_name is 'stats', increment the stat using the increment_stat function
    if (table_name === 'stats') {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_stat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          stat_id: id,
          inc_amount: inc_amount
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to increment stat: ${await response.text()}`);
      }
      
      const result = await response.json();
      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Otherwise increment a specific column in any table
    // For example, this will still work with incrementing the generation_count in profiles
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/increment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        inc_amount,
        table_name,
        column_name,
        id,
        id_column
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to increment: ${await response.text()}`);
    }
    
    const result = await response.json();
    
    // If the increment was for a figurine creation, also increment the global stats counter
    if (table_name === 'profiles' && column_name === 'generation_count') {
      try {
        await fetch(`${supabaseUrl}/rest/v1/rpc/increment_stat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            stat_id: 'image_generations',
            inc_amount: inc_amount
          }),
        });
      } catch (error) {
        console.error("Error updating global counter:", error);
        // Continue execution even if this fails
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
