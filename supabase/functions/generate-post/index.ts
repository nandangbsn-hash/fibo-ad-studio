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

    const { imageUrl, prompt, platform, tone, includeHashtags, includeEmojis } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    console.log('Generating post for image:', imageUrl);
    console.log('Platform:', platform, 'Tone:', tone);

    const platformLimits: Record<string, number> = {
      'instagram': 2200,
      'twitter': 280,
      'linkedin': 3000,
      'facebook': 63206,
      'tiktok': 2200,
    };

    const characterLimit = platformLimits[platform] || 2200;

    const systemPrompt = `You are an expert social media copywriter and marketing specialist. Generate engaging, platform-optimized social media posts based on product images.

Your posts should:
- Be optimized for ${platform} (max ${characterLimit} characters)
- Use a ${tone} tone
- ${includeHashtags ? 'Include relevant hashtags (5-10 for Instagram/TikTok, 3-5 for others)' : 'Do NOT include hashtags'}
- ${includeEmojis ? 'Use emojis strategically to enhance engagement' : 'Do NOT use emojis'}
- Include a compelling call-to-action
- Be ready to copy and paste directly to the platform

Return a JSON object with this exact structure:
{
  "post": "The main post content ready to publish",
  "alternativeVersions": ["2 alternative versions of the post"],
  "suggestedBestTime": "Best time to post on ${platform}",
  "engagementTips": ["2-3 tips to maximize engagement"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || 'Create an engaging social media post for this product that will drive engagement and sales.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('AI Response:', content);

    // Parse the JSON response
    let postData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      postData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return the raw content as the post if JSON parsing fails
      postData = {
        post: content,
        alternativeVersions: [],
        suggestedBestTime: 'Check platform analytics for your audience',
        engagementTips: ['Engage with comments quickly', 'Use high-quality visuals']
      };
    }

    console.log('Post generation complete');

    return new Response(JSON.stringify({
      success: true,
      ...postData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-post function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
