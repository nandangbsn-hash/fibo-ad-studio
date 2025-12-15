import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
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

    console.log('Generating product shot for:', productImageUrl);
    console.log('Scene description:', sceneDescription);
    console.log('User ID:', userId);

    // Use Lovable AI's image generation/editing capabilities via Gemini
    const prompt = `Create a professional product advertisement image. 
    
Take the product shown in the image and place it in a new scene:
${sceneDescription || 'Professional product photography with elegant background'}

Requirements:
- Keep the product clearly visible and as the main focus
- Create a visually appealing background that complements the product
- Ensure professional lighting and composition
- The final image should look like a high-end advertisement
- Aspect ratio: ${aspectRatio}`;

    console.log('Sending request to Lovable AI for image generation');

    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: productImageUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    console.log('Lovable AI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');

    // Extract the generated image from the response
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error('No image in response:', JSON.stringify(data));
      throw new Error('No image was generated');
    }

    console.log('Product shot generated successfully');

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
