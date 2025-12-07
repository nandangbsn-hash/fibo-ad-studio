import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { brandName, targetAudience, mood, colorScheme, productDescription } = await req.json();
    
    console.log('Analyzing brand:', brandName);

    const systemPrompt = `You are an expert advertising creative director and brand strategist specializing in AI-powered image generation.

Your task is to analyze brand information and generate professional ad concepts with BRIA FIBO-compatible structured prompts.

FIBO uses a specific JSON schema for image generation. Each structured_prompt must follow this exact format:

{
  "short_description": "A detailed 2-3 sentence description of the entire scene",
  "objects": [
    {
      "description": "Detailed description of the object",
      "location": "center | top-left | bottom-right | etc.",
      "relationship": "Relationship to other objects",
      "relative_size": "small | medium | large within frame",
      "shape_and_color": "Shape and color details",
      "texture": "Surface texture description",
      "appearance_details": "Additional visual details",
      "orientation": "horizontal | vertical | etc."
    }
  ],
  "background_setting": "Detailed background description",
  "lighting": {
    "conditions": "bright studio lighting | natural sunlight | golden hour | etc.",
    "direction": "front-lit | side-lit | backlit | diffused from multiple sources",
    "shadows": "Description of shadow qualities"
  },
  "aesthetics": {
    "composition": "centered | rule of thirds | symmetrical | etc.",
    "color_scheme": "Color palette description",
    "mood_atmosphere": "elegant | energetic | serene | etc.",
    "preference_score": "very high",
    "aesthetic_score": "very high"
  },
  "photographic_characteristics": {
    "depth_of_field": "shallow | medium | deep",
    "focus": "sharp focus on subject | soft focus | etc.",
    "camera_angle": "eye-level | high-angle | low-angle | etc.",
    "lens_focal_length": "wide (24mm) | standard (50mm) | portrait (85mm) | macro"
  },
  "style_medium": "photograph | 3D render | digital illustration | etc.",
  "context": "Context and intended use of the image",
  "artistic_style": "photorealistic | minimalist | cinematic | etc."
}

Generate creative, professional advertising concepts that would work for high-end product photography.`;

    const userPrompt = `Analyze this brand and generate 3 ad concepts with FIBO-compatible structured prompts:

Brand Name: ${brandName}
Target Audience: ${targetAudience}
Mood/Style: ${mood}
Color Scheme: ${colorScheme || 'To be determined based on brand analysis'}
Product Description: ${productDescription || 'Premium product'}

For each concept, provide:
1. A creative concept name and description
2. A complete FIBO structured_prompt following the exact schema above
3. A shot list with 3-5 shot descriptions
4. Recommended aspect_ratio (1:1, 4:5, 16:9, etc.)

Return your response as valid JSON with this structure:
{
  "brand_analysis": {
    "category": "string",
    "tone": "string", 
    "key_values": ["string"],
    "recommended_palette": "string"
  },
  "concepts": [
    {
      "name": "string",
      "description": "string",
      "structured_prompt": { /* full FIBO structured_prompt object */ },
      "shot_list": ["string"],
      "aspect_ratio": "1:1"
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content);
    
    console.log('Brand analysis complete, generated concepts:', generatedContent.concepts?.length);

    return new Response(JSON.stringify({
      success: true,
      ...generatedContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-brand function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
