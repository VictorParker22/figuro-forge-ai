
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
    
    // Step 1: Prepare the request payload and initiate the conversion
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

    // Using the v1 OpenAPI endpoint for conversion
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
    
    // Step 2: Extract the task ID from the response
    const taskId = initialResult.result || initialResult.id
    
    if (!taskId) {
      console.error("No task ID found in response:", initialResult)
      throw new Error('No task ID returned from conversion API')
    }
    
    console.log(`Task created with ID: ${taskId}, starting polling process`)
    
    // Step 3: Poll for task status until completion
    let modelUrl = null
    let attempts = 0
    const maxAttempts = 30 // Maximum number of polling attempts
    const pollingDelay = 2000 // 2 seconds between checks
    
    while (attempts < maxAttempts) {
      attempts++
      console.log(`Polling for task status: attempt ${attempts}/${maxAttempts}`)
      
      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, pollingDelay))
      
      // Check task status using the task ID
      const statusUrl = `https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`
      const statusResponse = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${MESHY_API_KEY}`
        }
      })
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        console.error(`Error checking task status: ${errorText}`)
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to check task status: ${errorText}`)
        }
        continue // Try again if not at max attempts
      }
      
      const statusData = await statusResponse.json()
      console.log(`Task status response:`, JSON.stringify(statusData))
      
      // Check if task is completed and we have a model URL
      if (statusData.status === 'completed' || statusData.status === 'SUCCESS') {
        // Try multiple possible fields where the URL might be stored
        modelUrl = statusData.glb_url || statusData.glbUrl || statusData.model_url
        if (modelUrl) {
          console.log(`Task completed successfully. Model URL: ${modelUrl}`)
          break
        }
      } else if (statusData.status === 'failed' || statusData.status === 'FAILED') {
        throw new Error(`Task failed: ${statusData.message || 'Unknown error'}`)
      }
      
      // If still processing, continue polling
      console.log(`Task still processing, will check again in ${pollingDelay/1000} seconds`)
    }
    
    // Check if we got a model URL after polling
    if (!modelUrl) {
      // Try to extract from the final status response if available
      if (attempts >= maxAttempts) {
        throw new Error('Task polling exceeded maximum attempts, no model URL obtained')
      } else {
        throw new Error('No model URL returned from conversion API after polling')
      }
    }

    // Create Supabase client to update the database with the model URL if needed
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Return the model URL and task info
    return new Response(
      JSON.stringify({ 
        success: true, 
        modelUrl,
        taskId,
        metadata: {
          format: 'glb', // Default format
          attempts: attempts
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
