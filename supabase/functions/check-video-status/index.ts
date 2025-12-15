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

    const body = await req.json();
    const { generation_id, video_id } = body;

    if (!generation_id) {
      throw new Error('Generation ID (task_id) is required');
    }

    console.log('Checking video status for task:', generation_id);

    // Generate JWT token for Kling API
    const jwtToken = await generateKlingToken(KLING_ACCESS_KEY, KLING_SECRET_KEY);

    // Poll Kling API for video status
    const response = await fetch(`${KLING_API_URL}/${generation_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Kling API status response:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kling API error:', errorText);
      throw new Error(`Kling API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Kling API status response:', JSON.stringify(data));

    // Kling status: submitted, processing, succeed, failed
    const taskStatus = data.data?.task_status || 'processing';
    const videos = data.data?.task_result?.videos || [];
    const videoUrl = videos[0]?.url || null;
    const videoDuration = videos[0]?.duration || null;

    // Map Kling status to our status
    let status = 'generating';
    if (taskStatus === 'succeed' && videoUrl) {
      status = 'complete';
    } else if (taskStatus === 'failed') {
      status = 'failed';
    } else if (taskStatus === 'processing' || taskStatus === 'submitted') {
      status = 'generating';
    }

    // Update database if video is complete or failed
    if (video_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      if (status === 'complete' && videoUrl) {
        const updateData: Record<string, unknown> = {
          status: 'complete',
          video_url: videoUrl,
        };
        if (videoDuration) {
          updateData.duration = videoDuration;
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('generated_videos')
          .update(updateData)
          .eq('id', video_id);

        if (updateError) {
          console.error('Error updating video record:', updateError);
        } else {
          console.log('Video record updated with URL');
        }
      } else if (status === 'failed') {
        const { error: updateError } = await supabaseAdmin
          .from('generated_videos')
          .update({ status: 'failed' })
          .eq('id', video_id);

        if (updateError) {
          console.error('Error updating video record:', updateError);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: status,
      video_url: videoUrl,
      duration: videoDuration,
      generation_id: generation_id,
      task_status: taskStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-video-status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
