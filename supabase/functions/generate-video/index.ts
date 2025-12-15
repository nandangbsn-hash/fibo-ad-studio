import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VEO_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_CLOUD_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!GOOGLE_CLOUD_API_KEY) {
      console.error('Google Cloud API key is not configured');
      throw new Error('Google Cloud API key is not configured');
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

    if (!prompt) {
      throw new Error('Prompt is required for video generation');
    }

    console.log('Generating video with Google Veo 3 API');
    console.log('Prompt:', prompt);
    console.log('Aspect ratio:', aspect_ratio);
    console.log('Duration:', duration);

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
        // Fetch image and convert to base64
        const imageResponse = await fetch(source_image_url);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const contentType = imageResponse.headers.get('content-type') || 'image/png';
          imageData = {
            mimeType: contentType,
            data: base64,
          };
        }
      }
      console.log('Image data prepared for Veo');
    }

    // Build the Veo 3 request
    const veoModel = "veo-3.0-generate-preview";
    const veoUrl = `${VEO_API_BASE}/${veoModel}:predictLongRunning?key=${GOOGLE_CLOUD_API_KEY}`;

    // Map aspect ratio
    const aspectRatioMap: Record<string, string> = {
      '16:9': '16:9',
      '9:16': '9:16',
      '1:1': '1:1',
    };

    const requestBody: any = {
      instances: [
        {
          prompt: prompt,
        }
      ],
      parameters: {
        aspectRatio: aspectRatioMap[aspect_ratio] || '16:9',
        durationSeconds: parseInt(duration) || 5,
        numberOfVideos: 1,
      }
    };

    // Add image if provided
    if (imageData) {
      requestBody.instances[0].image = {
        bytesBase64Encoded: imageData.data,
        mimeType: imageData.mimeType,
      };
    }

    console.log('Sending request to Veo 3...');
    console.log('Request URL:', veoUrl);

    const response = await fetch(veoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Veo 3 response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Veo 3 error:', errorText);
      throw new Error(`Veo 3 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Veo 3 response:', JSON.stringify(data));

    // The response contains an operation name for long-running operations
    const operationName = data.name;
    
    if (!operationName) {
      console.error('No operation name in response:', JSON.stringify(data));
      throw new Error('No operation name was returned from Veo 3 API');
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
          message: 'Video generation started with Veo 3. Poll for status updates.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generation_id: operationName,
      status: 'generating',
      message: 'Video generation started with Veo 3',
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
