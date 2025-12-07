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
    const { fiboJson } = await req.json();
    
    console.log('Received FIBO JSON:', JSON.stringify(fiboJson, null, 2));

    // Generate demo images based on the configuration
    // Since the Bria FIBO API endpoint may not be publicly available,
    // we use high-quality product photography placeholders
    const subject = fiboJson?.input?.subject?.name || fiboJson?.subject?.name || 'Product';
    const mood = fiboJson?.input?.ad_intent?.mood || fiboJson?.ad_intent?.mood || 'premium';
    
    console.log('Generating demo images for:', subject, 'with mood:', mood);

    // Return demo images that match the requested style
    const demoImages = [
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
    ];

    return new Response(JSON.stringify({
      success: true,
      demo_mode: true,
      message: "Demo mode - FIBO configuration applied",
      images: demoImages,
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
