import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRIA_API_URL = "https://engine.prod.bria-api.com/v2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRIA_API_KEY = Deno.env.get('BRIA_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!BRIA_API_KEY) {
      console.error('BRIA_API_KEY is not configured');
      throw new Error('BRIA_API_KEY is not configured');
    }

    // Extract user ID from Authorization header
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      console.log('User ID from token:', userId);
    }

    const { 
      productImageUrl, 
      sceneDescription, 
      aspectRatio = '1:1',
      campaign_id,
      concept_id
    } = await req.json();
    
    if (!productImageUrl) {
      throw new Error('Product image URL is required');
    }

    console.log('Generating product shot with BRIA for:', productImageUrl);
    console.log('Scene description:', sceneDescription);
    console.log('User ID:', userId);

    // Use BRIA's replace_background endpoint for product shots
    // BRIA API expects 'image' field, not 'image_url'
    const response = await fetch(`${BRIA_API_URL}/image/edit/replace_background`, {
      method: 'POST',
      headers: {
        'api_token': BRIA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: productImageUrl,
        prompt: sceneDescription || 'Professional product photography with elegant studio background, soft lighting',
        sync: true,
        original_quality: true,
      }),
    });

    console.log('BRIA API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BRIA API error:', errorText);
      throw new Error(`BRIA API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('BRIA API response received:', JSON.stringify(data));

    // Extract the generated image from BRIA response - image_url is nested in result object
    const generatedImage = data.result?.image_url || data.result_url || data.urls?.[0];
    
    if (!generatedImage) {
      console.error('No image in BRIA response:', JSON.stringify(data));
      throw new Error('No image was generated');
    }

    console.log('Product shot generated successfully:', generatedImage);

    // Save to database if user is authenticated
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await supabase.from('generated_images').insert({
          image_url: generatedImage,
          seed: null,
          structured_prompt: { scene_description: sceneDescription, product_image: productImageUrl },
          aspect_ratio: aspectRatio,
          user_id: userId,
          campaign_id: campaign_id || null,
          concept_id: concept_id || null,
          generation_type: 'product_shot',
          is_public: false
        });
        
        if (error) {
          console.error('Failed to save image to database:', error);
        } else {
          console.log('Product shot saved to database with user_id:', userId);
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      images: [{
        url: generatedImage,
        seed: null
      }]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-product-shot function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
