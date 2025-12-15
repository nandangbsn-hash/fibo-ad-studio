import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VEO_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_CLOUD_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('Google API key is not configured');
    }

    const body = await req.json();
    const { generation_id, video_id } = body;

    if (!generation_id) {
      throw new Error('generation_id is required');
    }

    console.log('Checking Veo 3 operation status:', generation_id);

    // Poll the operation status using x-goog-api-key header
    const statusUrl = `${VEO_API_BASE}/${generation_id}`;
    
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
    });

    console.log('Veo 3 status response:', statusResponse.status);

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Veo 3 status error:', errorText);
      throw new Error(`Veo 3 status error: ${statusResponse.status} - ${errorText}`);
    }

    const statusData = await statusResponse.json();
    console.log('Veo 3 status data:', JSON.stringify(statusData));

    // Check if operation is done
    const isDone = statusData.done === true;
    let status = 'generating';
    let videoUrl = '';
    let errorMessage = '';

    if (isDone) {
      if (statusData.error) {
        status = 'failed';
        errorMessage = statusData.error.message || 'Unknown error';
        console.error('Veo 3 generation failed:', errorMessage);
      } else if (statusData.response?.generateVideoResponse?.generatedSamples) {
        status = 'complete';
        const samples = statusData.response.generateVideoResponse.generatedSamples;
        if (samples.length > 0 && samples[0].video?.uri) {
          // The URI is a relative path, need to construct full URL with API key
          const videoUri = samples[0].video.uri;
          // The URI format is like "files/xxxxx:download?alt=media"
          // Need to append to base URL
          if (videoUri.startsWith('files/')) {
            videoUrl = `${VEO_API_BASE}/${videoUri}`;
          } else {
            videoUrl = videoUri;
          }
          console.log('Video URI from response:', videoUri);
          console.log('Constructed video URL:', videoUrl);
        }
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
      // Include API key hint for client-side download if needed
      needs_api_key: videoUrl ? true : false,
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
