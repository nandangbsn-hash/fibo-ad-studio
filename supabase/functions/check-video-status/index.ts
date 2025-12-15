import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate OAuth2 access token from service account
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;
  
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp,
  };
  
  const encoder = new TextEncoder();
  const base64UrlEncode = (data: Uint8Array) => {
    return btoa(String.fromCharCode(...data))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );
  
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;
  
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured');
    }

    // Parse service account to get project ID
    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;

    const body = await req.json();
    const { generation_id, video_id } = body;

    if (!generation_id) {
      throw new Error('generation_id is required');
    }

    console.log('Checking Vertex AI operation status:', generation_id);
    console.log('Project ID:', projectId);

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccountJson);

    // Extract model ID from the generation_id (full operation path)
    // Format: projects/PROJECT_ID/locations/us-central1/publishers/google/models/MODEL_ID/operations/OPERATION_ID
    const modelIdMatch = generation_id.match(/models\/([^\/]+)\/operations/);
    const modelId = modelIdMatch ? modelIdMatch[1] : 'veo-3.0-generate-001';
    
    console.log('Extracted model ID:', modelId);

    // Use fetchPredictOperation endpoint (POST request with operationName in body)
    const statusUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:fetchPredictOperation`;
    
    console.log('Status URL:', statusUrl);

    const statusResponse = await fetch(statusUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: generation_id,
      }),
    });

    console.log('Vertex AI status response:', statusResponse.status);

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Vertex AI status error:', errorText);
      throw new Error(`Vertex AI status error: ${statusResponse.status} - ${errorText}`);
    }

    const statusData = await statusResponse.json();
    console.log('Vertex AI status data:', JSON.stringify(statusData));

    // Check if operation is done
    const isDone = statusData.done === true;
    let status = 'generating';
    let videoUrl = '';
    let errorMessage = '';

    if (isDone) {
      if (statusData.error) {
        status = 'failed';
        errorMessage = statusData.error.message || 'Unknown error';
        console.error('Vertex AI generation failed:', errorMessage);
      } else if (statusData.response) {
        status = 'complete';
        // Extract video URL from response - Veo returns videos[].gcsUri
        const videos = statusData.response.videos || [];
        if (videos.length > 0) {
          videoUrl = videos[0].gcsUri || '';
        }
        console.log('Video URL:', videoUrl);
      }
    }

    // Update database if we have a video_id
    if (video_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && (status === 'complete' || status === 'failed')) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString(),
      };

      if (videoUrl) {
        updateData.video_url = videoUrl;
      }

      const { error: updateError } = await supabaseAdmin
        .from('generated_videos')
        .update(updateData)
        .eq('id', video_id);

      if (updateError) {
        console.error('Error updating video record:', updateError);
      } else {
        console.log('Video record updated successfully');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: status,
      done: isDone,
      video_url: videoUrl,
      error: errorMessage || undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking video status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
