
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

    console.log("Creating 3D conversion task...")
    
    // Prepare the request body based on what we received
    const requestBody: any = {
      outputFormat: 'glb',
      background: 'remove'
    }
    
    // Add either the URL or the base64 data
    if (imageBase64) {
      requestBody.imageBase64 = imageBase64
    } else {
      requestBody.imageUrl = imageUrl
    }

    // Step 1: Create a task to generate a 3D model from the image
    // Updated to use the correct API endpoint path based on Meshy's latest API docs
    const createTaskResponse = await fetch('https://api.meshy.ai/v2/image-to-3d/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MESHY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text()
      console.error(`Error creating task: ${errorText}`)
      throw new Error(`Failed to create 3D conversion task: ${errorText}`)
    }

    const taskData = await createTaskResponse.json()
    const taskId = taskData.taskId || taskData.id

    if (!taskId) {
      console.error("No task ID in response:", taskData)
      throw new Error('No task ID returned from Meshy API')
    }

    console.log(`Task created with ID: ${taskId}`)

    // Step 2: Poll the task status until it's complete (with a timeout)
    let modelUrl = null
    let attempts = 0
    const maxAttempts = 30
    const delayMs = 2000

    while (attempts < maxAttempts) {
      attempts++
      
      // Wait before checking status
      await new Promise(resolve => setTimeout(resolve, delayMs))
      
      console.log(`Checking task status, attempt ${attempts}/${maxAttempts}`)
      // Updated to use the correct task status endpoint
      const statusResponse = await fetch(`https://api.meshy.ai/v2/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${MESHY_API_KEY}`,
        }
      })

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        console.error(`Error checking status: ${errorText}`)
        throw new Error(`Failed to check task status: ${errorText}`)
      }

      const statusData = await statusResponse.json()
      console.log(`Task status: ${statusData.status}, attempt ${attempts}/${maxAttempts}`)

      if (statusData.status === 'SUCCESS') {
        modelUrl = statusData.result?.glbUrl || statusData.output?.glbUrl || null
        console.log(`Task completed successfully. Model URL: ${modelUrl}`)
        break
      } else if (statusData.status === 'FAILED') {
        console.error(`Task failed: ${statusData.message || 'Unknown error'}`)
        throw new Error(`Task failed: ${statusData.message || 'Unknown error'}`)
      }
      
      // If we're still processing, continue polling
    }

    if (!modelUrl) {
      throw new Error('Task did not complete in the allotted time or no model URL was returned')
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
        taskId
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
