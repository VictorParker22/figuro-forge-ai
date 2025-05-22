
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  return null
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Parse request body
    const { imageUrl, imageBase64 } = await req.json()

    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image URL or Base64 data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Log which format we're using
    if (imageBase64) {
      console.log("Processing base64 image data for 3D conversion")
    } else {
      console.log(`Processing image URL for 3D conversion: ${imageUrl}`)
    }

    // Get Meshy.ai API key from environment variables
    const MESHY_API_KEY = Deno.env.get('MESHY_API_KEY')
    if (!MESHY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Meshy API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log("Creating 3D conversion request...")
    
    // Prepare the request payload
    const requestPayload: any = {
      outputFormat: 'glb',
      enable_pbr: true,
      should_remesh: true,
      should_texture: true,
      background: 'remove'
    }
    
    // Add either the URL or the base64 data
    if (imageBase64) {
      // Handle base64 data URI
      requestPayload.image_url = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/png;base64,${imageBase64}`
    } else {
      requestPayload.image_url = imageUrl
    }

    // Using the v1 OpenAPI endpoint for a simpler, direct conversion
    const response = await fetch('https://api.meshy.ai/openapi/v1/image-to-3d', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MESHY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error during 3D conversion: ${errorText}`)
      throw new Error(`Failed to convert image to 3D model: ${errorText}`)
    }

    // Parse the response from Meshy API
    const result = await response.json()
    
    console.log("3D conversion succeeded, result:", JSON.stringify(result))
    
    // Get the model URL from the response
    const modelUrl = result.glb_url || result.glbUrl || result.model_url
    
    if (!modelUrl) {
      throw new Error('No model URL returned from conversion API')
    }

    // Create Supabase client to update the database with the model URL if needed
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Return the model URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        modelUrl,
        // Include additional metadata if available in the response
        metadata: {
          format: result.format || 'glb',
          fileSize: result.file_size || null,
          conversionId: result.id || null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error converting image to 3D:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to convert image to 3D', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
