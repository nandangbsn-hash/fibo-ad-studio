import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { 
      productImageUrl, 
      sceneDescription, 
      aspectRatio = '1:1'
    } = await req.json();
    
    if (!productImageUrl) {
      throw new Error('Product image URL is required');
    }

    console.log('Generating product shot for:', productImageUrl);
    console.log('Scene description:', sceneDescription);

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
