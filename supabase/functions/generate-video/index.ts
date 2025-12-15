import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEYGEN_UPLOAD_URL = "https://upload.heygen.com/v1/talking_photo";
const HEYGEN_GENERATE_URL = "https://api.heygen.com/v2/video/generate";

// Helper to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new ArrayBuffer(binaryString.length);
  const view = new Uint8Array(bytes);
  for (let i = 0; i < binaryString.length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HEYGEN_API_KEY = Deno.env.get('HEYGEN_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!HEYGEN_API_KEY) {
      console.error('HeyGen API key is not configured');
      throw new Error('HeyGen API key is not configured');
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

    console.log('Generating video with HeyGen API');
    console.log('Prompt:', prompt);
    console.log('Aspect ratio:', aspect_ratio);

    // Step 1: Upload image to get talking_photo_id
    let imageBuffer: ArrayBuffer;
    let contentType = 'image/png';
    
    if (source_image_url.startsWith('data:')) {
      // Extract content type and base64 data
      const match = source_image_url.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        const base64Data = match[2];
        imageBuffer = base64ToArrayBuffer(base64Data);
        console.log('Extracted image data, size:', imageBuffer.byteLength, 'bytes');
      } else {
        throw new Error('Invalid data URL format');
      }
    } else {
      // Fetch image from URL
      const imageResponse = await fetch(source_image_url);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch source image');
      }
      imageBuffer = await imageResponse.arrayBuffer();
      contentType = imageResponse.headers.get('content-type') || 'image/png';
    }

    console.log('Uploading image to HeyGen...');
    
    const uploadResponse = await fetch(HEYGEN_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': contentType,
      },
      body: imageBuffer,
    });

    console.log('HeyGen upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('HeyGen upload error:', errorText);
      throw new Error(`HeyGen upload error: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('HeyGen upload response:', JSON.stringify(uploadData));

    const talkingPhotoId = uploadData.data?.talking_photo_id;
    if (!talkingPhotoId) {
      throw new Error('No talking_photo_id returned from HeyGen');
    }

    console.log('Got talking_photo_id:', talkingPhotoId);

    // Step 2: Generate video with the talking photo
    const dimensionMap: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
    };
    const dimension = dimensionMap[aspect_ratio] || dimensionMap['16:9'];

    const generatePayload = {
      video_inputs: [
        {
          character: {
            type: 'talking_photo',
            talking_photo_id: talkingPhotoId,
          },
          voice: {
            type: 'text',
            input_text: prompt || 'Presenting this product with subtle natural movement.',
            voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54', // Default English voice
          },
        },
      ],
      dimension: dimension,
      test: false,
    };

    console.log('Generating video with payload:', JSON.stringify(generatePayload));

    const response = await fetch(HEYGEN_GENERATE_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generatePayload),
    });

    console.log('HeyGen generate response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HeyGen generate error:', errorText);
      throw new Error(`HeyGen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('HeyGen generate response:', JSON.stringify(data));

    const videoId = data.data?.video_id;
    
    if (!videoId) {
      console.error('No video ID in response:', JSON.stringify(data));
      throw new Error('No video ID was returned from HeyGen API');
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
        generation_id: videoId,
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
          generation_id: videoId,
          status: 'generating',
          message: 'Video generation started. Poll for status updates.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generation_id: videoId,
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
