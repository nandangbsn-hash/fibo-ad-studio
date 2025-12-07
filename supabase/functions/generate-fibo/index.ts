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
    
    const hasPromptValue = prompt && typeof prompt === 'string' && prompt.trim().length > 0;
    const hasStructuredPromptValue = structured_prompt && 
      (typeof structured_prompt === 'string' ? structured_prompt.trim().length > 0 : Object.keys(structured_prompt).length > 0);
    
    console.log('Generate FIBO request:', { 
      hasPrompt: hasPromptValue, 
      hasStructuredPrompt: hasStructuredPromptValue,
      structuredPromptType: typeof structured_prompt,
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

    // Bria API expects either a text prompt OR a structured_prompt string from a previous generation
    // For initial generation, we convert our structured prompt object to a descriptive text prompt
    if (hasStructuredPromptValue) {
      // If structured_prompt is an object, extract a text description for initial generation
      if (typeof structured_prompt === 'object') {
        // Build a rich text prompt from the structured prompt object
        const sp = structured_prompt;
        const parts: string[] = [];
        
        if (sp.short_description) {
          parts.push(sp.short_description);
        }
        
        if (sp.objects && Array.isArray(sp.objects)) {
          sp.objects.forEach((obj: any) => {
            if (obj.description) parts.push(obj.description);
            if (obj.appearance_details) parts.push(obj.appearance_details);
          });
        }
        
        if (sp.background_setting) {
          parts.push(`Background: ${sp.background_setting}`);
        }
        
        if (sp.lighting) {
          const lighting = sp.lighting;
          if (lighting.conditions) parts.push(`Lighting: ${lighting.conditions}`);
        }
        
        if (sp.aesthetics) {
          const a = sp.aesthetics;
          if (a.mood_atmosphere) parts.push(`Mood: ${a.mood_atmosphere}`);
          if (a.color_scheme) parts.push(`Colors: ${a.color_scheme}`);
        }
        
        if (sp.photographic_characteristics) {
          const p = sp.photographic_characteristics;
          if (p.camera_angle) parts.push(`Camera: ${p.camera_angle}`);
          if (p.depth_of_field) parts.push(`DOF: ${p.depth_of_field}`);
        }
        
        if (sp.style_medium) {
          parts.push(`Style: ${sp.style_medium}`);
        }
        
        if (sp.artistic_style) {
          parts.push(sp.artistic_style);
        }
        
        requestBody.prompt = parts.join('. ');
        console.log('Generated text prompt from structured prompt:', requestBody.prompt);
      } else {
        // It's already a string - this would be from a previous Bria API response
        requestBody.structured_prompt = structured_prompt;
      }
      
      // If also have an additional prompt, append it for refinement
      if (hasPromptValue) {
        if (requestBody.prompt) {
          requestBody.prompt = `${requestBody.prompt}. ${prompt}`;
        } else {
          requestBody.prompt = prompt;
        }
      }
    } else if (hasPromptValue) {
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
