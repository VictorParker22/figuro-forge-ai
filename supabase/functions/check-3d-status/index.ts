
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
    // Parse request body or URL query parameters
    const url = new URL(req.url)
    let taskId
    
    // Check if we're getting the task ID from URL params or body
    if (req.method === 'GET') {
      taskId = url.searchParams.get('taskId')
    } else {
      const { taskId: bodyTaskId } = await req.json()
      taskId = bodyTaskId
    }

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Task ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Meshy.ai API key from environment variables
    const MESHY_API_KEY = Deno.env.get('MESHY_API_KEY')
    if (!MESHY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Meshy API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`Checking status for task: ${taskId}`)
    
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
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check task status', 
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusResponse.status }
      )
    }
    
    const statusData = await statusResponse.json()
    console.log(`Task status response:`, JSON.stringify(statusData))
    
    // Prepare the response with the appropriate data
    let responseData: any = {
      taskId,
      status: statusData.status,
      progress: statusData.progress || 0,
      createdAt: statusData.created_at,
      startedAt: statusData.started_at || 0,
      finishedAt: statusData.finished_at || 0
    }
    
    // Add model URL if the task is completed
    if (statusData.status === 'completed' || statusData.status === 'SUCCESS' || statusData.status === 'SUCCEEDED') {
      // Check multiple possible locations for the model URL
      const modelUrl = statusData.model_urls?.glb || 
                      statusData.glb_url || 
                      statusData.glbUrl || 
                      statusData.model_url
                      
      if (modelUrl) {
        responseData.modelUrl = modelUrl
        responseData.success = true
        responseData.thumbnail = statusData.thumbnail_url
        
        // Include texture URLs if available
        if (statusData.texture_urls && statusData.texture_urls.length > 0) {
          responseData.textureUrls = statusData.texture_urls
        }
      }
    } else if (statusData.status === 'failed' || statusData.status === 'FAILED') {
      responseData.error = statusData.task_error?.message || statusData.message || 'Unknown error'
      responseData.success = false
    } else {
      // Still processing
      responseData.success = false
    }
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error checking 3D conversion status:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check 3D conversion status', 
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
