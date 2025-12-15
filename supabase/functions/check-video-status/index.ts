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

    const body = await req.json();
    const { generation_id, video_id } = body;

    if (!generation_id) {
      throw new Error('Generation ID is required');
    }

    console.log('Checking video status for generation:', generation_id);

    // Poll AI/ML API for video status
    const response = await fetch(`${AIML_API_URL}?generation_id=${generation_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('AI/ML API status response:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI/ML API error:', errorText);
      throw new Error(`AI/ML API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI/ML API status response:', JSON.stringify(data));

    const status = data.status || 'pending';
    const videoUrl = data.video_url || data.video?.url || data.result_url;

    // Update database if video is complete
    if (video_id && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      if (status === 'completed' && videoUrl) {
        const { error: updateError } = await supabaseAdmin
          .from('generated_videos')
          .update({
            status: 'complete',
            video_url: videoUrl,
          })
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
      status: status === 'completed' ? 'complete' : status,
      video_url: videoUrl || null,
      generation_id: generation_id,
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
