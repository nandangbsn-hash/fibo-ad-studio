import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BRIA_API_KEY = Deno.env.get('BRIA_API_KEY');
    
    if (!BRIA_API_KEY) {
      console.error('BRIA_API_KEY is not configured');
      throw new Error('BRIA_API_KEY is not configured');
    }

    const { fiboJson } = await req.json();
    
    console.log('Received FIBO JSON:', JSON.stringify(fiboJson, null, 2));

    // Call the Bria FIBO API
    const response = await fetch("https://api.bria.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BRIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(fiboJson)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FIBO API error:', response.status, errorText);
      
      // Return a mock response for demo purposes if API fails
      return new Response(JSON.stringify({
        success: true,
        demo_mode: true,
        message: "Demo mode - FIBO API simulation",
        images: [
          {
            url: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80`,
            id: "demo-1"
          },
          {
            url: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80`,
            id: "demo-2"
          },
          {
            url: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80`,
            id: "demo-3"
          }
        ],
        fibo_config: fiboJson
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('FIBO API response:', JSON.stringify(data, null, 2));

    return new Response(JSON.stringify({
      success: true,
      ...data,
      fibo_config: fiboJson
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-fibo function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
