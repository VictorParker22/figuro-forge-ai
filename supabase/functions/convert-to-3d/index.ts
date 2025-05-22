
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
    
    // Return the task ID immediately to the client
    // This way the client can continue and won't time out
    const responseForClient = new Response(
      JSON.stringify({ 
        success: true, 
        taskId,
        status: 'processing',
        message: 'Conversion task started successfully. You can check the status using the taskId.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

    // Use background processing to continue polling for the task completion
    // This allows the function to return immediately while processing continues
    const backgroundProcessing = async () => {
      console.log(`Task created with ID: ${taskId}, starting polling process`)
      
      // Improved polling with extended parameters
      let modelUrl = null
      let attempts = 0
      const maxAttempts = 60 // Increased from 30 to allow for longer processing times
      const pollingDelay = 5000 // Increased from 2000 ms to reduce API calls and allow more processing time
      
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
            console.error(`Task polling exceeded maximum attempts (${maxAttempts}). Last error: ${errorText}`)
            break
          }
          continue // Try again if not at max attempts
        }
        
        const statusData = await statusResponse.json()
        console.log(`Task status response:`, JSON.stringify(statusData))
        
        // Check if task is completed and we have a model URL
        if (statusData.status === 'completed' || statusData.status === 'SUCCESS' || statusData.status === 'SUCCEEDED') {
          // FIX: First check in the model_urls object as per the API documentation
          modelUrl = statusData.model_urls?.glb || 
                    statusData.glb_url || 
                    statusData.glbUrl || 
                    statusData.model_url
                    
          if (modelUrl) {
            console.log(`Task completed successfully. Model URL: ${modelUrl}`)
            
            // Create Supabase client to update the database with the model URL
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
            const supabase = createClient(supabaseUrl, supabaseServiceKey)
            
            // Here you could update a database record with the model URL
            // For example, if you have a table tracking conversion tasks:
            // await supabase.from('conversion_tasks').update({ model_url: modelUrl, status: 'completed' }).eq('task_id', taskId)
            
            console.log("Background processing completed successfully.")
            break
          }
        } else if (statusData.status === 'failed' || statusData.status === 'FAILED') {
          console.error(`Task failed: ${statusData.task_error?.message || statusData.message || 'Unknown error'}`)
          break
        }
        
        // If still processing, continue polling
        const progress = statusData.progress || 0
        console.log(`Task still processing (${progress}%), will check again in ${pollingDelay/1000} seconds`)
      }
      
      if (!modelUrl && attempts >= maxAttempts) {
        console.error('Task polling exceeded maximum attempts, no model URL obtained')
      }
    }
    
    // Start the background processing without awaiting
    try {
      EdgeRuntime.waitUntil(backgroundProcessing())
    } catch (e) {
      console.warn("EdgeRuntime.waitUntil not supported in this environment:", e)
      // Fall back to fire-and-forget approach
      backgroundProcessing().catch(err => {
        console.error("Error in background processing:", err)
      })
    }
    
    // Return the immediate response to the client
    return responseForClient

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
