import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRIA_API_URL = 'https://engine.prod.bria-api.com/v2';

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

    const body = await req.json();
    const { 
      prompt, 
      structured_prompt, 
      aspect_ratio = '1:1',
      seed,
      guidance_scale = 5,
      steps_num = 50,
      sync = true,
      campaign_id,
      concept_id
    } = body;
    
    const hasPromptValue = prompt && typeof prompt === 'string' && prompt.trim().length > 0;
    const hasStructuredPromptValue = structured_prompt && 
      (typeof structured_prompt === 'string' ? structured_prompt.trim().length > 0 : Object.keys(structured_prompt).length > 0);
    
    console.log('Generate FIBO request:', { 
      hasPrompt: hasPromptValue, 
      hasStructuredPrompt: hasStructuredPromptValue,
      structuredPromptType: typeof structured_prompt,
      aspect_ratio,
      sync,
      userId
    });

    // Build the request body according to Bria API v2
    const requestBody: Record<string, unknown> = {
      aspect_ratio,
      guidance_scale,
      steps_num,
      sync,
      prompt_content_moderation: true,
      visual_output_content_moderation: true,
    };

    // Bria API expects either a text prompt OR a structured_prompt string from a previous generation
    // For initial generation, we convert our structured prompt object to a descriptive text prompt
    if (hasStructuredPromptValue) {
      // If structured_prompt is an object, extract a text description for initial generation
      if (typeof structured_prompt === 'object') {
        // Build a rich text prompt from the structured prompt object
        const sp = structured_prompt;
        const parts: string[] = [];
        
        if (sp.short_description) {
          parts.push(sp.short_description);
        }
        
        if (sp.objects && Array.isArray(sp.objects)) {
          sp.objects.forEach((obj: any) => {
            if (obj.description) parts.push(obj.description);
            if (obj.appearance_details) parts.push(obj.appearance_details);
          });
        }
        
        if (sp.background_setting) {
          parts.push(`Background: ${sp.background_setting}`);
        }
        
        // === CAMERA & LENS ===
        if (sp.camera_and_lens) {
          const cam = sp.camera_and_lens;
          const camDesc: string[] = [];
          if (cam.camera_body) camDesc.push(`shot on ${cam.camera_body.replace(/_/g, ' ')}`);
          if (cam.lens_type) camDesc.push(`${cam.lens_type.replace(/_/g, ' ')} lens`);
          if (cam.focal_length_mm) camDesc.push(`${cam.focal_length_mm}mm focal length`);
          if (cam.aperture_f_stop) camDesc.push(`f/${cam.aperture_f_stop} aperture`);
          if (cam.shot_preset) camDesc.push(`${cam.shot_preset.replace(/_/g, ' ')} shot`);
          if (camDesc.length > 0) parts.push(`Camera: ${camDesc.join(', ')}`);
        }
        
        // === GEOMETRY (Camera angles/position) ===
        if (sp.geometry) {
          const geo = sp.geometry;
          const geoDesc: string[] = [];
          if (geo.tilt_degrees && geo.tilt_degrees !== 0) geoDesc.push(`${geo.tilt_degrees}° tilt`);
          if (geo.pan_degrees && geo.pan_degrees !== 0) geoDesc.push(`${geo.pan_degrees}° pan`);
          if (geo.roll_degrees && geo.roll_degrees !== 0) geoDesc.push(`${geo.roll_degrees}° roll (dutch angle)`);
          if (geo.distance_meters) geoDesc.push(`${geo.distance_meters}m camera distance`);
          if (geoDesc.length > 0) parts.push(`Camera position: ${geoDesc.join(', ')}`);
        }
        
        // === LIGHTING (Full details) ===
        if (sp.lighting) {
          const light = sp.lighting;
          const lightDesc: string[] = [];
          if (light.lighting_type) lightDesc.push(light.lighting_type.replace(/_/g, ' '));
          if (light.conditions) lightDesc.push(light.conditions);
          if (light.key_light) {
            if (light.key_light.intensity_percent !== undefined) {
              lightDesc.push(`key light at ${light.key_light.intensity_percent}% intensity`);
            }
            if (light.key_light.softness_percent !== undefined) {
              lightDesc.push(`${light.key_light.softness_percent}% softness`);
            }
            if (light.key_light.temperature_kelvin) {
              lightDesc.push(`${light.key_light.temperature_kelvin}K color temperature`);
            }
          }
          if (light.fill_light?.intensity_percent !== undefined) {
            lightDesc.push(`fill light at ${light.fill_light.intensity_percent}%`);
          }
          if (light.rim_light?.intensity_percent !== undefined) {
            lightDesc.push(`rim light at ${light.rim_light.intensity_percent}%`);
          }
          if (lightDesc.length > 0) parts.push(`Lighting: ${lightDesc.join(', ')}`);
        }
        
        // === FOCUS & MOTION ===
        if (sp.focus_and_motion) {
          const fm = sp.focus_and_motion;
          const fmDesc: string[] = [];
          if (fm.depth_of_field) fmDesc.push(`${fm.depth_of_field.replace(/_/g, ' ')} depth of field`);
          if (fm.focus_distance_meters) fmDesc.push(`focus at ${fm.focus_distance_meters}m`);
          if (fm.shutter_speed) fmDesc.push(`${fm.shutter_speed} shutter speed`);
          if (fm.shutter_angle_degrees) fmDesc.push(`${fm.shutter_angle_degrees}° shutter angle`);
          if (fm.motion_blur_amount) fmDesc.push(`${fm.motion_blur_amount.replace(/_/g, ' ')} motion blur`);
          if (fmDesc.length > 0) parts.push(`Focus: ${fmDesc.join(', ')}`);
        }
        
        // === SENSOR & EXPOSURE ===
        if (sp.sensor_and_exposure) {
          const se = sp.sensor_and_exposure;
          const seDesc: string[] = [];
          if (se.sensor_size) seDesc.push(`${se.sensor_size.replace(/_/g, ' ')} sensor`);
          if (se.iso) seDesc.push(`ISO ${se.iso}`);
          if (se.exposure_compensation_ev && se.exposure_compensation_ev !== 0) {
            seDesc.push(`${se.exposure_compensation_ev > 0 ? '+' : ''}${se.exposure_compensation_ev} EV exposure compensation`);
          }
          if (se.white_balance_kelvin) seDesc.push(`${se.white_balance_kelvin}K white balance`);
          if (se.dynamic_range) seDesc.push(`${se.dynamic_range.replace(/_/g, ' ')} dynamic range`);
          if (seDesc.length > 0) parts.push(`Exposure: ${seDesc.join(', ')}`);
        }
        
        // === AESTHETICS ===
        if (sp.aesthetics) {
          const a = sp.aesthetics;
          if (a.mood_atmosphere) parts.push(`Mood: ${a.mood_atmosphere}`);
          if (a.color_scheme) parts.push(`Colors: ${a.color_scheme}`);
        }
        
        // === VISUAL & COLOR (Full details) ===
        if (sp.visual_and_color) {
          const vc = sp.visual_and_color;
          
          // Add color palette with explicit color instructions
          if (vc.color_palette && Array.isArray(vc.color_palette) && vc.color_palette.length > 0) {
            const colorDescriptions = vc.color_palette.map((c: any, i: number) => {
              const role = i === 0 ? 'primary' : i === 1 ? 'secondary' : 'accent';
              return `${c.hex || `hsl(${c.hue}, ${c.saturation}%, ${c.lightness}%)`} as ${role}`;
            });
            parts.push(`Use a color scheme with ${colorDescriptions.join(', ')}. These colors should be prominently visible in the image`);
          }
          
          // Add HDR settings
          if (vc.hdr_enabled) {
            parts.push('HDR enabled with high dynamic range, enhanced highlights and shadows');
          }
          
          // Add bit depth for color richness
          if (vc.color_bit_depth) {
            parts.push(`${vc.color_bit_depth} color depth for ${vc.color_bit_depth === '16-bit' ? 'maximum' : vc.color_bit_depth === '12-bit' ? 'high' : 'standard'} color richness`);
          }
          
          // Add color space
          if (vc.color_space) {
            parts.push(`${vc.color_space} color space`);
          }
          
          // Add color grading
          if (vc.color_grading && vc.color_grading !== 'none') {
            parts.push(`${vc.color_grading.replace(/_/g, ' ')} color grading`);
          }
          
          // Add mood filter
          if (vc.mood_filter && vc.mood_filter !== 'none') {
            parts.push(`${vc.mood_filter.replace(/_/g, ' ')} mood filter`);
          }
          
          // Add tone mapping
          if (vc.tone_mapping && vc.tone_mapping !== 'none') {
            parts.push(`${vc.tone_mapping.replace(/_/g, ' ')} tone mapping`);
          }
          
          // Add tone adjustments
          if (vc.tone_adjustments) {
            const ta = vc.tone_adjustments;
            const toneDesc: string[] = [];
            if (ta.brightness && ta.brightness !== 0) toneDesc.push(`brightness ${ta.brightness > 0 ? 'increased' : 'decreased'}`);
            if (ta.contrast && ta.contrast !== 0) toneDesc.push(`${ta.contrast > 0 ? 'high' : 'low'} contrast`);
            if (ta.saturation && ta.saturation !== 0) toneDesc.push(`${ta.saturation > 0 ? 'vibrant' : 'muted'} saturation`);
            if (ta.vibrance && ta.vibrance !== 0) toneDesc.push(`${ta.vibrance > 0 ? 'enhanced' : 'reduced'} vibrance`);
            if (ta.clarity && ta.clarity !== 0) toneDesc.push(`${ta.clarity > 0 ? 'enhanced' : 'reduced'} clarity`);
            if (toneDesc.length > 0) parts.push(`Tone: ${toneDesc.join(', ')}`);
          }
          
          // Add luminance controls
          if (vc.luminance_controls) {
            const lc = vc.luminance_controls;
            const lcDesc: string[] = [];
            if (lc.highlights_percent !== undefined && lc.highlights_percent !== 50) {
              lcDesc.push(`${lc.highlights_percent > 50 ? 'boosted' : 'reduced'} highlights`);
            }
            if (lc.shadows_percent !== undefined && lc.shadows_percent !== 50) {
              lcDesc.push(`${lc.shadows_percent > 50 ? 'lifted' : 'crushed'} shadows`);
            }
            if (lc.whites_percent !== undefined && lc.whites_percent !== 50) {
              lcDesc.push(`${lc.whites_percent > 50 ? 'bright' : 'subdued'} whites`);
            }
            if (lc.blacks_percent !== undefined && lc.blacks_percent !== 50) {
              lcDesc.push(`${lc.blacks_percent > 50 ? 'lifted' : 'deep'} blacks`);
            }
            if (lcDesc.length > 0) parts.push(`Luminance: ${lcDesc.join(', ')}`);
          }
        }
        
        // === PHOTOGRAPHIC CHARACTERISTICS ===
        if (sp.photographic_characteristics) {
          const p = sp.photographic_characteristics;
          const photoDesc: string[] = [];
          if (p.camera_angle) photoDesc.push(`${p.camera_angle.replace(/_/g, ' ')} angle`);
          if (p.depth_of_field) photoDesc.push(`${p.depth_of_field.replace(/_/g, ' ')} DOF`);
          if (p.focus) photoDesc.push(`${p.focus.replace(/_/g, ' ')} focus`);
          if (p.lens_focal_length) photoDesc.push(`${p.lens_focal_length}`);
          if (photoDesc.length > 0) parts.push(`Photo: ${photoDesc.join(', ')}`);
        }
        
        if (sp.style_medium) {
          parts.push(`Style: ${sp.style_medium}`);
        }
        
        if (sp.artistic_style) {
          parts.push(sp.artistic_style);
        }
        
        requestBody.prompt = parts.join('. ');
        console.log('Generated text prompt from structured prompt:', requestBody.prompt);
      } else {
        // It's already a string - this would be from a previous Bria API response
        requestBody.structured_prompt = structured_prompt;
      }
      
      // If also have an additional prompt, append it for refinement
      if (hasPromptValue) {
        if (requestBody.prompt) {
          requestBody.prompt = `${requestBody.prompt}. ${prompt}`;
        } else {
          requestBody.prompt = prompt;
        }
      }
    } else if (hasPromptValue) {
      // Text-only generation
      requestBody.prompt = prompt;
    } else {
      throw new Error('Either prompt or structured_prompt is required');
    }

    if (seed !== undefined) {
      requestBody.seed = seed;
    }

    console.log('Calling Bria API with:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${BRIA_API_URL}/image/generate`, {
      method: 'POST',
      headers: {
        'api_token': BRIA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Bria API response status:', response.status);
    console.log('Bria API response:', responseText);

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        throw new Error('Invalid BRIA API key');
      }
      if (response.status === 422) {
        throw new Error('Content moderation failed or invalid input');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Bria API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);

    // Helper function to save image to database
    const saveToDatabase = async (imageUrl: string, imageSeed: number | null, structuredPromptResult: any) => {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.log('Supabase not configured, skipping database save');
        return;
      }
      
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await supabase.from('generated_images').insert({
          image_url: imageUrl,
          seed: imageSeed,
          structured_prompt: structuredPromptResult || structured_prompt,
          aspect_ratio: aspect_ratio,
          user_id: userId,
          campaign_id: campaign_id || null,
          concept_id: concept_id || null,
          generation_type: 'initial',
          is_public: false
        });
        
        if (error) {
          console.error('Failed to save image to database:', error);
        } else {
          console.log('Image saved to database with user_id:', userId);
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
    };

    // Handle async response (status 202)
    if (response.status === 202 && data.status_url) {
      console.log('Async request, polling status URL:', data.status_url);
      
      // Poll for completion
      const result = await pollForResult(data.status_url, BRIA_API_KEY);
      
      // Save to database
      await saveToDatabase(result.image_url, result.seed, result.structured_prompt);
      
      return new Response(JSON.stringify({
        success: true,
        image_url: result.image_url,
        seed: result.seed,
        structured_prompt: result.structured_prompt,
        request_id: data.request_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sync response (status 200)
    if (data.result) {
      // Save to database
      await saveToDatabase(data.result.image_url, data.result.seed, data.result.structured_prompt);
      
      return new Response(JSON.stringify({
        success: true,
        image_url: data.result.image_url,
        seed: data.result.seed,
        structured_prompt: data.result.structured_prompt,
        request_id: data.request_id,
        warning: data.warning
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unexpected response format from Bria API');

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

async function pollForResult(
  statusUrl: string, 
  apiKey: string, 
  maxAttempts = 60, 
  intervalMs = 2000
): Promise<{ image_url: string; seed: number; structured_prompt: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);
    
    const response = await fetch(statusUrl, {
      headers: {
        'api_token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Poll response:', JSON.stringify(data));

    if (data.status === 'completed' && data.result) {
      return {
        image_url: data.result.image_url,
        seed: data.result.seed,
        structured_prompt: data.result.structured_prompt
      };
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Image generation failed');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Image generation timed out');
}
