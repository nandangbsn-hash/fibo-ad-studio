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

    const systemPrompt = `You are an expert advertising creative director and brand strategist. 
Your task is to analyze brand information and generate professional ad concepts with FIBO-compatible JSON configurations.

FIBO is a JSON-native image generation model that uses structured cinematography parameters:
- camera: angle (0-90), fov (10-120), distance (0.5-5), shot type, preset
- lighting: type, intensity (0-1), position, color_temperature
- composition: framing, background, depth_of_field
- style: color_palette, contrast, hdr, grain
- subject: type, name, brand, position, context
- ad_intent: mood, target_audience, format, copy_direction

Generate creative, professional advertising concepts that would work for high-end product photography.`;

    const userPrompt = `Analyze this brand and generate 3 ad concepts with FIBO configurations:

Brand Name: ${brandName}
Target Audience: ${targetAudience}
Mood/Style: ${mood}
Color Scheme: ${colorScheme || 'To be determined based on brand analysis'}
Product Description: ${productDescription || 'Premium product'}

For each concept, provide:
1. Concept name and description
2. A complete FIBO JSON configuration
3. Shot list with 3-5 shot descriptions

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
      "fibo_config": { /* full FIBO JSON */ },
      "shot_list": ["string"]
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
    
    console.log('Brand analysis complete');

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
