import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KLING_API_URL = "https://api.klingai.com/v1/videos/image2video";

// Generate JWT token for Kling API
async function generateKlingToken(accessKey: string, secretKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const payload = {
    iss: accessKey,
    exp: now + 1800, // 30 minutes
    nbf: now - 5     // Valid 5 seconds ago
  };
  
  // Create the key for signing
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Base64URL encode helper
  const base64UrlEncode = (data: Uint8Array | string): string => {
    const str = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  
  const signatureB64 = base64UrlEncode(new Uint8Array(signature).reduce((s, b) => s + String.fromCharCode(b), ''));
  
  return `${message}.${signatureB64}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLING_ACCESS_KEY = Deno.env.get('KLING_ACCESS_KEY');
    const KLING_SECRET_KEY = Deno.env.get('KLING_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      console.error('Kling API keys are not configured');
      throw new Error('Kling API keys are not configured');
    }

    // Extract user ID from Authorization header
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        console.log('Extracted user ID:', userId);
      } catch (e) {
        console.log('Could not extract user from token:', e);
      }
    }

    const body = await req.json();
    const { 
      source_image_url, 
      source_image_id,
      prompt, 
      aspect_ratio = '16:9',
      duration = '5'
    } = body;

    if (!source_image_url) {
      throw new Error('Source image URL is required');
    }

    console.log('Generating video with Kling API for:', source_image_url);
    console.log('Prompt:', prompt);
    console.log('Aspect ratio:', aspect_ratio);
    console.log('Duration:', duration);

    // Generate JWT token for Kling API
    const jwtToken = await generateKlingToken(KLING_ACCESS_KEY, KLING_SECRET_KEY);
    console.log('Generated Kling JWT token');

    // Submit video generation task to Kling API
    const response = await fetch(KLING_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_name: 'kling-v1',
        image: source_image_url,
        prompt: prompt || 'Subtle camera movement, cinematic product reveal',
        negative_prompt: '',
        cfg_scale: 0.5,
        mode: 'std',
        duration: duration,
        aspect_ratio: aspect_ratio,
      }),
    });

    console.log('Kling API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kling API error:', errorText);
      throw new Error(`Kling API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Kling API response:', JSON.stringify(data));

    const taskId = data.data?.task_id;
    
    if (!taskId) {
      console.error('No task ID in response:', JSON.stringify(data));
      throw new Error('No task ID was returned from Kling API');
    }

    // Save initial video record to database
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const videoRecord = {
        user_id: userId,
        source_image_id: source_image_id || null,
        video_url: '',
        video_prompt: prompt,
        aspect_ratio: aspect_ratio,
        duration: parseInt(duration),
        status: 'generating',
        generation_id: taskId,
        is_public: false,
      };

      const { data: insertedVideo, error: insertError } = await supabaseAdmin
        .from('generated_videos')
        .insert(videoRecord)
        .select()
        .single();

      if (insertError) {
        console.error('Error saving video record:', insertError);
      } else {
        console.log('Video record saved with ID:', insertedVideo.id);
        
        return new Response(JSON.stringify({
          success: true,
          video_id: insertedVideo.id,
          generation_id: taskId,
          status: 'generating',
          message: 'Video generation started. Poll for status updates.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generation_id: taskId,
      status: 'generating',
      message: 'Video generation started',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-video:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
