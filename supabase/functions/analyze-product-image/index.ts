import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { productImageUrl } = await req.json();
    
    if (!productImageUrl) {
      throw new Error('Product image URL is required');
    }

    console.log('Analyzing product image:', productImageUrl);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a product photography and advertising expert. Analyze the product image and provide detailed information that will help generate compelling ad visuals.

Return a JSON object with this exact structure:
{
  "product_name": "Best guess at product name/type",
  "product_category": "Category like 'cosmetics', 'electronics', 'food & beverage', 'fashion', etc.",
  "colors": ["Array of dominant colors in the product"],
  "materials": ["Array of materials visible like 'glass', 'metal', 'plastic', 'fabric', etc."],
  "shape": "Overall shape description",
  "texture": "Surface texture description",
  "style": "Product style like 'luxury', 'minimalist', 'playful', 'professional', etc.",
  "suggested_backgrounds": [
    "3-5 background scene suggestions that would complement this product"
  ],
  "suggested_lighting": "Recommended lighting style for this product",
  "suggested_mood": "Recommended mood/atmosphere for ads",
  "key_features": ["Visual features that should be highlighted"],
  "description": "A detailed 2-3 sentence description suitable for ad generation"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product image and provide detailed information for ad generation.'
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a basic structure if parsing fails
      analysis = {
        product_name: 'Product',
        product_category: 'general',
        colors: [],
        materials: [],
        shape: 'standard',
        texture: 'smooth',
        style: 'modern',
        suggested_backgrounds: ['Clean studio background', 'Gradient background', 'Natural setting'],
        suggested_lighting: 'Soft studio lighting',
        suggested_mood: 'Professional',
        key_features: [],
        description: 'A product ready for advertising'
      };
    }

    console.log('Product analysis complete:', analysis.product_name);

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-product-image function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
