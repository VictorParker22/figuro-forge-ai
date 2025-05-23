import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory store for active SSE connections
const sseConnections = new Map<string, ReadableStreamController<Uint8Array>>();

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  return null
}

// Format an SSE message
const formatSseMessage = (data: any, event?: string) => {
  let message = '';
  if (event) {
    message += `event: ${event}\n`;
  }
  message += `data: ${JSON.stringify(data)}\n\n`;
  return message;
}

// Send a message to all active connections for a task
const broadcastTaskUpdate = (taskId: string, data: any, event?: string) => {
  const controller = sseConnections.get(taskId);
  if (controller) {
    try {
      const message = formatSseMessage(data, event);
      controller.enqueue(new TextEncoder().encode(message));
      console.log(`Broadcast to task ${taskId}: ${event || 'message'}`);
      return true;
    } catch (error) {
      console.error(`Error broadcasting to task ${taskId}:`, error);
      return false;
    }
  }
  return false;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Parse request URL parameters
    const url = new URL(req.url)
    const taskId = url.searchParams.get('taskId');
    const isWebhook = url.searchParams.get('webhook') === 'true';
    const isSSE = url.searchParams.get('sse') === 'true';

    // Handle webhook callbacks from Meshy.ai
    if (isWebhook) {
      console.log("Processing webhook callback from Meshy.ai");
      
      try {
        // Get the payload from the webhook
        const webhookData = await req.json();
        console.log("Webhook payload:", JSON.stringify(webhookData));
        
        // Extract task ID from webhook data
        const callbackTaskId = webhookData.task_id || webhookData.id;
        
        if (!callbackTaskId) {
          console.error("No task ID in webhook payload");
          return new Response(
            JSON.stringify({ error: "Invalid webhook payload, missing task ID" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // Broadcast the webhook data to any connected SSE clients
        broadcastTaskUpdate(callbackTaskId, webhookData, webhookData.status || 'update');
        
        // Store the update in Supabase for persistence and handle model URL
        try {
          // Create Supabase client
          const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
          
          if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            
            // Prepare the update data
            const updateData: any = { 
              status: webhookData.status || 'updated',
              updated_at: new Date().toISOString(),
              result_data: webhookData
            };
            
            // Check if we have a model URL and completed status
            if ((webhookData.status === 'completed' || webhookData.status === 'SUCCESS' || 
                 webhookData.status === 'SUCCEEDED') && 
                (webhookData.model_urls?.glb || webhookData.glb_url || 
                 webhookData.model_url)) {
              
              // Extract the model URL from wherever it is in the webhook data
              updateData.model_url = webhookData.model_urls?.glb || 
                                    webhookData.glb_url || 
                                    webhookData.glbUrl || 
                                    webhookData.model_url;
              
              console.log(`Task ${callbackTaskId} completed with model URL: ${updateData.model_url}`);
            }
            
            // Update task status
            const { error } = await supabase
              .from('conversion_tasks')
              .update(updateData)
              .eq('task_id', callbackTaskId);
              
            if (error) {
              console.error("Error updating task status in database:", error);
            }
          }
        } catch (dbError) {
          console.error("Error storing webhook data:", dbError);
          // Non-critical error, continue processing
        }
        
        // Acknowledge webhook receipt
        return new Response(
          JSON.stringify({ success: true, message: "Webhook received and processed" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (webhookError) {
        console.error("Error processing webhook:", webhookError);
        return new Response(
          JSON.stringify({ error: "Failed to process webhook", details: webhookError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    
    // Handle Server-Sent Events (SSE) connection requests
    if (isSSE && taskId) {
      console.log(`Setting up SSE connection for task: ${taskId}`);
      
      // Set up SSE stream
      const stream = new ReadableStream({
        start(controller) {
          // Store the controller for this task ID
          sseConnections.set(taskId, controller);
          
          // Send initial connection message
          const initialMessage = formatSseMessage({
            type: 'connected',
            taskId,
            timestamp: new Date().toISOString()
          }, 'connected');
          controller.enqueue(new TextEncoder().encode(initialMessage));
          
          console.log(`SSE connection established for task: ${taskId}`);
          
          // Check if we have any stored status for this task
          try {
            // This runs asynchronously but we don't need to await it
            (async () => {
              const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
              const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
              
              if (supabaseUrl && supabaseServiceKey) {
                const supabase = createClient(supabaseUrl, supabaseServiceKey);
                
                // Get the latest status
                const { data, error } = await supabase
                  .from('conversion_tasks')
                  .select('*')
                  .eq('task_id', taskId)
                  .single();
                
                if (data && !error) {
                  // Send the stored status
                  const statusMessage = formatSseMessage({
                    ...data.result_data || {},
                    status: data.status,
                    taskId,
                    source: 'database'
                  }, 'status');
                  controller.enqueue(new TextEncoder().encode(statusMessage));
                  console.log(`Sent stored status for task: ${taskId}`);
                }
                
                // If we don't have a stored status, check with the Meshy API
                if (!data || data.status === 'processing') {
                  await checkTaskWithMeshyApi(taskId, controller);
                }
              }
            })();
          } catch (dbError) {
            console.error("Error checking stored task status:", dbError);
          }
        },
        cancel() {
          // Clean up when the client disconnects
          console.log(`SSE connection closed for task: ${taskId}`);
          sseConnections.delete(taskId);
        }
      });

      // Return the SSE stream
      return new Response(stream.pipeThrough(new TextEncoderStream()), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Handle regular status check requests
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
        
        console.log(`Task ${taskId} completed with model URL: ${modelUrl}`);
      }
    } else if (statusData.status === 'failed' || statusData.status === 'FAILED') {
      responseData.error = statusData.task_error?.message || statusData.message || 'Unknown error'
      responseData.success = false
    } else {
      // Still processing
      responseData.success = false
    }
    
    // Broadcast the status update to SSE clients
    broadcastTaskUpdate(taskId, responseData, responseData.status);
    
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

// Helper function to check task status with Meshy API
async function checkTaskWithMeshyApi(taskId: string, controller?: ReadableStreamController<Uint8Array>) {
  const MESHY_API_KEY = Deno.env.get('MESHY_API_KEY');
  if (!MESHY_API_KEY) {
    console.error('Meshy API key not configured');
    return null;
  }
  
  try {
    const statusUrl = `https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`;
    const statusResponse = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${MESHY_API_KEY}`
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error(`API returned status ${statusResponse.status}`);
    }
    
    const statusData = await statusResponse.json();
    console.log(`Manual check for task ${taskId}:`, JSON.stringify(statusData));
    
    // Format response data
    const responseData: any = {
      taskId,
      status: statusData.status,
      progress: statusData.progress || 0,
      source: 'api_check'
    };
    
    // Add model URL if completed
    if (statusData.status === 'completed' || statusData.status === 'SUCCESS' || statusData.status === 'SUCCEEDED') {
      const modelUrl = statusData.model_urls?.glb || 
                      statusData.glb_url || 
                      statusData.glbUrl || 
                      statusData.model_url;
                      
      if (modelUrl) {
        responseData.modelUrl = modelUrl;
        responseData.success = true;
        responseData.thumbnail = statusData.thumbnail_url;
        
        if (statusData.texture_urls && statusData.texture_urls.length > 0) {
          responseData.textureUrls = statusData.texture_urls;
        }
      }
    }
    
    // Update database if we have a result
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('conversion_tasks')
          .upsert({
            task_id: taskId,
            status: statusData.status,
            updated_at: new Date().toISOString(),
            result_data: statusData
          });
      }
    } catch (dbError) {
      console.error("Error updating task status in database:", dbError);
    }
    
    // Send SSE message if we have a controller
    if (controller) {
      try {
        const message = formatSseMessage(responseData, statusData.status);
        controller.enqueue(new TextEncoder().encode(message));
      } catch (sseError) {
        console.error(`Error sending SSE message for task ${taskId}:`, sseError);
      }
    }
    
    return responseData;
  } catch (error) {
    console.error(`Error checking task ${taskId} with Meshy API:`, error);
    
    // Send error message if we have a controller
    if (controller) {
      try {
        const errorMessage = formatSseMessage({
          taskId,
          error: error.message,
          status: 'error'
        }, 'error');
        controller.enqueue(new TextEncoder().encode(errorMessage));
      } catch (sseError) {
        console.error(`Error sending SSE error message for task ${taskId}:`, sseError);
      }
    }
    
    return null;
  }
}
