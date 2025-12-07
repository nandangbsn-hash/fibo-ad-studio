import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRIA_API_URL = 'https://engine.prod.bria-api.com/v2';

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

    const body = await req.json();
    const { 
      prompt, 
      structured_prompt, 
      aspect_ratio = '1:1',
      seed,
      guidance_scale = 5,
      steps_num = 50,
      sync = true 
    } = body;
    
    console.log('Generate FIBO request:', { 
      hasPrompt: !!prompt, 
      hasStructuredPrompt: !!structured_prompt,
      aspect_ratio,
      sync
    });

    // Build the request body according to Bria API v2
    const requestBody: Record<string, unknown> = {
      aspect_ratio,
      guidance_scale,
      steps_num,
      sync,
      prompt_content_moderation: true,
      visual_output_content_moderation: true,
    };

    // Handle mutually exclusive inputs
    if (structured_prompt) {
      // Use structured prompt for precise control
      requestBody.structured_prompt = typeof structured_prompt === 'string' 
        ? structured_prompt 
        : JSON.stringify(structured_prompt);
      
      // If also have prompt, it acts as refinement
      if (prompt) {
        requestBody.prompt = prompt;
      }
    } else if (prompt) {
      // Text-only generation
      requestBody.prompt = prompt;
    } else {
      throw new Error('Either prompt or structured_prompt is required');
    }

    if (seed !== undefined) {
      requestBody.seed = seed;
    }

    console.log('Calling Bria API with:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${BRIA_API_URL}/image/generate`, {
      method: 'POST',
      headers: {
        'api_token': BRIA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Bria API response status:', response.status);
    console.log('Bria API response:', responseText);

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Invalid BRIA API key');
      }
      if (response.status === 422) {
        throw new Error('Content moderation failed or invalid input');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Bria API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);

    // Handle async response (status 202)
    if (response.status === 202 && data.status_url) {
      console.log('Async request, polling status URL:', data.status_url);
      
      // Poll for completion
      const result = await pollForResult(data.status_url, BRIA_API_KEY);
      
      return new Response(JSON.stringify({
        success: true,
        image_url: result.image_url,
        seed: result.seed,
        structured_prompt: result.structured_prompt,
        request_id: data.request_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sync response (status 200)
    if (data.result) {
      return new Response(JSON.stringify({
        success: true,
        image_url: data.result.image_url,
        seed: data.result.seed,
        structured_prompt: data.result.structured_prompt,
        request_id: data.request_id,
        warning: data.warning
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unexpected response format from Bria API');

  } catch (error) {
    console.error('Error in generate-fibo function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function pollForResult(
  statusUrl: string, 
  apiKey: string, 
  maxAttempts = 60, 
  intervalMs = 2000
): Promise<{ image_url: string; seed: number; structured_prompt: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);
    
    const response = await fetch(statusUrl, {
      headers: {
        'api_token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Poll response:', JSON.stringify(data));

    if (data.status === 'completed' && data.result) {
      return {
        image_url: data.result.image_url,
        seed: data.result.seed,
        structured_prompt: data.result.structured_prompt
      };
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Image generation failed');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Image generation timed out');
}
