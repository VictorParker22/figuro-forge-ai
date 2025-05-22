
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
    
    // Get current URL to construct the webhook callback URL
    const url = new URL(req.url)
    const baseUrl = Deno.env.get('SUPABASE_URL') || `${url.protocol}//${url.hostname}`
    const callbackUrl = `${baseUrl}/functions/v1/check-3d-status?webhook=true`
    
    console.log("Creating 3D conversion request with webhook callback...")
    console.log(`Webhook callback URL: ${callbackUrl}`)
    
    // Step 1: Prepare the request payload with webhook callback
    const requestPayload: any = {
      outputFormat: 'glb',
      enable_pbr: true,
      should_remesh: true,
      should_texture: true,
      background: 'remove',
      webhook_url: callbackUrl  // Add webhook URL for callbacks
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

    // Using the v1 OpenAPI endpoint for conversion with webhook
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
    const initialResult = await response.json()
    console.log("Initial API response:", JSON.stringify(initialResult))
    
    // Extract the task ID from the response
    const taskId = initialResult.result || initialResult.id
    
    if (!taskId) {
      console.error("No task ID found in response:", initialResult)
      throw new Error('No task ID returned from conversion API')
    }
    
    // Create Supabase client for storing task info
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (baseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(baseUrl, supabaseServiceKey)
        
        // Store task information - this is useful for tracking webhooks
        await supabase.from('conversion_tasks').upsert({
          task_id: taskId,
          status: 'processing',
          created_at: new Date().toISOString(),
          image_url: imageUrl || 'base64-image'
        }).select()
        
        console.log(`Stored task info in database. Task ID: ${taskId}`)
      } catch (dbError) {
        // Non-critical error - log it but continue
        console.error("Failed to store task info in database:", dbError)
        // Note: Not stopping execution, as this is not critical for the conversion process
      }
    }

    // Return the task ID to the client immediately
    console.log(`Task created with ID: ${taskId}, webhook will be called when complete`)
    return new Response(
      JSON.stringify({ 
        success: true, 
        taskId,
        status: 'processing',
        message: 'Conversion task started. Server-sent events will provide updates.'
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

// Add event listener to handle shutdown
addEventListener('beforeunload', (ev) => {
  console.log('Function shutdown due to:', ev.detail?.reason)
})
