
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
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Converting image to 3D model: ${imageUrl}`)

    // Get Meshy.ai API key from environment variables
    const MESHY_API_KEY = Deno.env.get('MESHY_API_KEY')
    if (!MESHY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Meshy API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Step 1: Create a task to generate a 3D model from the image
    const createTaskResponse = await fetch('https://api.meshy.ai/v2/image-to-3d', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MESHY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        outputFormat: 'glb',
        background: 'remove'
      })
    })

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text()
      throw new Error(`Failed to create 3D conversion task: ${errorText}`)
    }

    const taskData = await createTaskResponse.json()
    const taskId = taskData.taskId

    if (!taskId) {
      throw new Error('No task ID returned from Meshy API')
    }

    console.log(`Task created with ID: ${taskId}`)

    // Step 2: Poll the task status until it's complete (with a timeout)
    let modelUrl = null
    let attempts = 0
    const maxAttempts = 20
    const delayMs = 2000

    while (attempts < maxAttempts) {
      attempts++
      
      // Wait before checking status
      await new Promise(resolve => setTimeout(resolve, delayMs))
      
      const statusResponse = await fetch(`https://api.meshy.ai/v2/task-status?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${MESHY_API_KEY}`,
        }
      })

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        throw new Error(`Failed to check task status: ${errorText}`)
      }

      const statusData = await statusResponse.json()
      console.log(`Task status: ${statusData.status}, attempt ${attempts}/${maxAttempts}`)

      if (statusData.status === 'SUCCESS') {
        modelUrl = statusData.result?.glbUrl || null
        break
      } else if (statusData.status === 'FAILED') {
        throw new Error(`Task failed: ${statusData.message || 'Unknown error'}`)
      }
      
      // If we're still processing, continue polling
    }

    if (!modelUrl) {
      throw new Error('Task did not complete in the allotted time or no model URL was returned')
    }

    // Create Supabase client to update the database
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
