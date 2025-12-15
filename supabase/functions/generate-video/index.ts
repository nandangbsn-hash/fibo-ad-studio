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
    
    console.log('Generating video with Google Vertex AI Veo');
    console.log('Project ID:', projectId);

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

    if (!prompt) {
      throw new Error('Prompt is required for video generation');
    }

    console.log('Prompt:', prompt);
    console.log('Aspect ratio:', aspect_ratio);
    console.log('Duration:', duration);

    // Get OAuth2 access token
    console.log('Getting OAuth2 access token...');
    const accessToken = await getAccessToken(serviceAccountJson);
    console.log('Got access token successfully');

    // Prepare image for Veo if provided
    let imageData = null;
    if (source_image_url) {
      if (source_image_url.startsWith('data:')) {
        const match = source_image_url.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (match) {
          imageData = {
            mimeType: match[1],
            data: match[2],
          };
        }
      } else {
        try {
          const imageResponse = await fetch(source_image_url);
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const contentType = imageResponse.headers.get('content-type') || 'image/png';
            imageData = {
              mimeType: contentType,
              data: base64,
            };
            console.log('Image converted to base64, size:', base64.length);
          }
        } catch (e) {
          console.log('Could not fetch image:', e);
        }
      }
    }

    // Build Vertex AI request body
    const requestBody: any = {
      instances: [{
        prompt: prompt,
      }],
      parameters: {
        aspectRatio: aspect_ratio,
        sampleCount: 1,
      },
    };

    // Add image if provided (image-to-video)
    if (imageData) {
      requestBody.instances[0].image = {
        bytesBase64Encoded: imageData.data,
        mimeType: imageData.mimeType,
      };
      console.log('Added image to request for image-to-video generation');
    }

    // Vertex AI endpoint for Veo 3
    const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/veo-3.0-generate-001:predictLongRunning`;
    
    console.log('Sending request to Vertex AI...');
    console.log('Request URL:', vertexUrl);

    const response = await fetch(vertexUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Vertex AI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vertex AI error:', errorText);
      throw new Error(`Vertex AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Vertex AI response:', JSON.stringify(data));

    // Get operation name for polling
    const operationName = data.name;
    
    if (!operationName) {
      console.error('No operation name in response:', JSON.stringify(data));
      throw new Error('No operation name was returned from Vertex AI');
    }

    console.log('Got operation name:', operationName);

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
        generation_id: operationName,
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
          generation_id: operationName,
          status: 'generating',
          message: 'Video generation started with Vertex AI Veo.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generation_id: operationName,
      status: 'generating',
      message: 'Video generation started with Vertex AI Veo',
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
