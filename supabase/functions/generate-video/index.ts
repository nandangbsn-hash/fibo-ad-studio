import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AIML_API_URL = "https://api.aimlapi.com/v2/generate/video";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AIML_API_KEY = Deno.env.get('AIML_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!AIML_API_KEY) {
      console.error('AIML_API_KEY is not configured');
      throw new Error('AIML_API_KEY is not configured');
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
      resolution = '1080p'
    } = body;

    if (!source_image_url) {
      throw new Error('Source image URL is required');
    }

    console.log('Generating video with Veo 3.1 for:', source_image_url);
    console.log('Prompt:', prompt);
    console.log('Aspect ratio:', aspect_ratio);
    console.log('Resolution:', resolution);

    // Submit video generation task to AI/ML API
    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'veo-3.1',
        image_url: source_image_url,
        prompt: prompt || 'Subtle camera movement, cinematic product reveal',
        aspect_ratio: aspect_ratio,
        resolution: resolution,
      }),
    });

    console.log('AI/ML API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI/ML API error:', errorText);
      throw new Error(`AI/ML API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI/ML API response:', JSON.stringify(data));

    const generationId = data.id || data.generation_id;
    
    if (!generationId) {
      console.error('No generation ID in response:', JSON.stringify(data));
      throw new Error('No generation ID was returned');
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
        resolution: resolution,
        status: 'generating',
        generation_id: generationId,
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
          generation_id: generationId,
          status: 'generating',
          message: 'Video generation started. Poll for status updates.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generation_id: generationId,
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
