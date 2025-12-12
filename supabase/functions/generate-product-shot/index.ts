import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRIA_API_KEY = Deno.env.get('BRIA_API_KEY');
    
    if (!BRIA_API_KEY) {
      console.error('BRIA_API_KEY is not configured');
      throw new Error('BRIA_API_KEY is not configured');
    }

    const { 
      productImageUrl, 
      sceneDescription, 
      placementType = 'automatic',
      aspectRatio = '1:1',
      optimizeDescription = true
    } = await req.json();
    
    if (!productImageUrl) {
      throw new Error('Product image URL is required');
    }

    console.log('Generating product shot for:', productImageUrl);
    console.log('Scene description:', sceneDescription);

    // Convert aspect ratio to BRIA format
    const aspectRatioMap: Record<string, string> = {
      '1:1': '1:1',
      '4:5': '4:5',
      '16:9': '16:9',
      '9:16': '9:16',
      '3:4': '3:4',
      '4:3': '4:3'
    };
    
    const briaAspectRatio = aspectRatioMap[aspectRatio] || '1:1';

    // Build the request body for BRIA Product Shot API
    const requestBody: Record<string, unknown> = {
      image_url: productImageUrl,
      scene_description: sceneDescription || 'Professional product photography with elegant background',
      placement_type: placementType,
      aspect_ratio: briaAspectRatio,
      optimize_description: optimizeDescription
    };

    console.log('BRIA Product Shot request:', JSON.stringify(requestBody));

    // Call BRIA Product Shot API
    const response = await fetch('https://engine.prod.bria-api.com/v1/product/shot', {
      method: 'POST',
      headers: {
        'api_token': BRIA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('BRIA response status:', response.status);
    console.log('BRIA response:', responseText);

    if (!response.ok) {
      throw new Error(`BRIA API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response from BRIA: ${responseText}`);
    }

    // Handle async job response (202) - poll for result
    if (response.status === 202 && data.job_id) {
      console.log('Product shot job started, polling for result:', data.job_id);
      
      const result = await pollForResult(data.status_url || `https://engine.prod.bria-api.com/v1/product/shot/${data.job_id}`, BRIA_API_KEY);
      
      return new Response(JSON.stringify({
        success: true,
        images: [{
          url: result.image_url,
          seed: result.seed || null
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle synchronous response
    if (data.result_url || data.image_url) {
      return new Response(JSON.stringify({
        success: true,
        images: [{
          url: data.result_url || data.image_url,
          seed: data.seed || null
        }]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unexpected response format from BRIA');

  } catch (error) {
    console.error('Error in generate-product-shot function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function pollForResult(statusUrl: string, apiKey: string, maxAttempts = 60, intervalMs = 2000): Promise<{ image_url: string; seed?: number }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'api_token': apiKey,
      },
    });

    if (!response.ok) {
      console.error('Poll error:', response.status);
      continue;
    }

    const data = await response.json();
    console.log('Poll response:', JSON.stringify(data));

    if (data.status === 'completed' || data.status === 'succeeded') {
      if (data.result_url || data.image_url) {
        return {
          image_url: data.result_url || data.image_url,
          seed: data.seed
        };
      }
    }

    if (data.status === 'failed' || data.status === 'error') {
      throw new Error(`Product shot generation failed: ${data.error || 'Unknown error'}`);
    }
  }

  throw new Error('Product shot generation timed out');
}
