// ============= BRIA FIBO API v2 Types =============

// Structured Prompt Object Interface (matches Bria FIBO API)
export interface FiboObject {
  description: string;
  location: string;
  relationship?: string;
  relative_size: string;
  shape_and_color: string;
  texture: string;
  appearance_details: string;
  number_of_objects?: number;
  orientation?: string;
  pose?: string;
  expression?: string;
  action?: string;
  gender?: string;
  clothing?: string;
  skin_tone_and_texture?: string;
}

export interface FiboLighting {
  conditions: string;
  direction: string;
  shadows: string;
}

export interface FiboAesthetics {
  composition: string;
  color_scheme: string;
  mood_atmosphere: string;
  preference_score: string;
  aesthetic_score: string;
}

export interface FiboPhotographicCharacteristics {
  depth_of_field: string;
  focus: string;
  camera_angle: string;
  lens_focal_length: string;
}

export interface FiboTextRender {
  text: string;
  location: string;
  size: string;
  color: string;
  font: string;
  appearance_details: string;
}

// Main FIBO Structured Prompt (matches Bria API response format)
export interface FiboStructuredPrompt {
  short_description: string;
  objects: FiboObject[];
  background_setting: string;
  lighting: FiboLighting;
  aesthetics: FiboAesthetics;
  photographic_characteristics: FiboPhotographicCharacteristics;
  style_medium: string;
  text_render?: FiboTextRender[];
  context: string;
  artistic_style: string;
}

// API Request/Response types
export interface BriaGenerateRequest {
  prompt?: string;
  images?: string[];
  structured_prompt?: string;
  negative_prompt?: string;
  guidance_scale?: number;
  model_version?: string;
  aspect_ratio?: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9";
  steps_num?: number;
  seed?: number;
  sync?: boolean;
  ip_signal?: boolean;
  prompt_content_moderation?: boolean;
  visual_input_content_moderation?: boolean;
  visual_output_content_moderation?: boolean;
}

export interface BriaGenerateResponse {
  result?: {
    image_url: string;
    seed: number;
    structured_prompt: string;
  };
  request_id: string;
  status_url?: string;
  warning?: string;
}

export interface BriaStatusResponse {
  status: "pending" | "processing" | "completed" | "failed";
  result?: {
    image_url: string;
    seed: number;
    structured_prompt: string;
  };
  error?: string;
}

// Application-level config for UI controls
export interface AppCameraSettings {
  angle: string;
  focal_length: string;
  depth_of_field: string;
  shot_type: string;
}

export interface AppLightingSettings {
  conditions: string;
  direction: string;
  intensity: string;
}

export interface AppCompositionSettings {
  layout: string;
  background: string;
  mood: string;
}

export interface AppStyleSettings {
  medium: string;
  artistic_style: string;
  color_scheme: string;
}

export interface AppConfig {
  camera: AppCameraSettings;
  lighting: AppLightingSettings;
  composition: AppCompositionSettings;
  style: AppStyleSettings;
  aspect_ratio: string;
  subject_description: string;
}

// Brand intake and concept types
export interface BrandIntake {
  brandName: string;
  targetAudience: string;
  mood: string;
  colorScheme: string;
  productDescription: string;
}

export interface AdConcept {
  name: string;
  description: string;
  structured_prompt: FiboStructuredPrompt;
  shot_list: string[];
  aspect_ratio: string;
}

export interface BrandAnalysis {
  category: string;
  tone: string;
  key_values: string[];
  recommended_palette: string;
}

export interface GeneratedImage {
  url: string;
  id: string;
  seed?: number;
  structured_prompt?: string;
}

// UI Presets
export const SHOT_TYPES = [
  { value: 'close-up', label: 'Close-up' },
  { value: 'macro', label: 'Macro' },
  { value: 'eye-level', label: 'Eye Level' },
  { value: 'high-angle', label: 'High Angle' },
  { value: 'low-angle', label: 'Low Angle' },
  { value: 'top-down', label: 'Top-down / Flat Lay' },
  { value: 'dutch-angle', label: 'Dutch Angle' },
  { value: 'wide-shot', label: 'Wide Shot' },
];

export const FOCAL_LENGTHS = [
  { value: 'wide (24mm)', label: 'Wide (24mm)' },
  { value: 'standard (35mm)', label: 'Standard (35mm)' },
  { value: 'standard (50mm)', label: 'Normal (50mm)' },
  { value: 'portrait (85mm)', label: 'Portrait (85mm)' },
  { value: 'telephoto (135mm)', label: 'Telephoto (135mm)' },
  { value: 'macro', label: 'Macro Lens' },
];

export const DEPTH_OF_FIELD_TYPES = [
  { value: 'shallow', label: 'Shallow (Bokeh)' },
  { value: 'medium', label: 'Medium' },
  { value: 'deep', label: 'Deep (All in focus)' },
];

export const LIGHTING_CONDITIONS = [
  { value: 'bright, even studio lighting', label: 'Studio Soft' },
  { value: 'natural sunlight', label: 'Natural Sunlight' },
  { value: 'golden hour', label: 'Golden Hour' },
  { value: 'moonlight', label: 'Moonlight' },
  { value: 'dramatic spotlight', label: 'Spotlight' },
  { value: 'soft, diffused', label: 'Diffused' },
  { value: 'neon lighting', label: 'Neon' },
  { value: 'backlit', label: 'Backlit' },
];

export const LIGHTING_DIRECTIONS = [
  { value: 'front-lit', label: 'Front Light' },
  { value: 'side-lit from left', label: 'Side Light (Left)' },
  { value: 'side-lit from right', label: 'Side Light (Right)' },
  { value: 'top-lit', label: 'Top Light' },
  { value: 'backlit', label: 'Back Light' },
  { value: 'diffused from multiple sources', label: 'Multi-directional' },
];

export const COMPOSITION_LAYOUTS = [
  { value: 'centered', label: 'Centered' },
  { value: 'rule of thirds', label: 'Rule of Thirds' },
  { value: 'symmetrical', label: 'Symmetrical' },
  { value: 'asymmetrical', label: 'Asymmetrical' },
  { value: 'golden ratio', label: 'Golden Ratio' },
  { value: 'leading lines', label: 'Leading Lines' },
  { value: 'frame within frame', label: 'Frame in Frame' },
];

export const BACKGROUND_TYPES = [
  { value: 'clean, seamless white studio backdrop', label: 'White Seamless' },
  { value: 'solid black background', label: 'Black Solid' },
  { value: 'gradient background', label: 'Gradient' },
  { value: 'natural environment', label: 'Natural/Outdoor' },
  { value: 'minimalist interior', label: 'Minimalist Interior' },
  { value: 'abstract blurred', label: 'Abstract Blur' },
  { value: 'lifestyle context', label: 'Lifestyle' },
];

export const MOOD_ATMOSPHERES = [
  { value: 'elegant, luxurious, sophisticated', label: 'Luxury' },
  { value: 'energetic, vibrant, dynamic', label: 'Energetic' },
  { value: 'calm, serene, peaceful', label: 'Serene' },
  { value: 'mysterious, dramatic', label: 'Dramatic' },
  { value: 'playful, fun, whimsical', label: 'Playful' },
  { value: 'natural, organic, earthy', label: 'Natural' },
  { value: 'futuristic, tech, modern', label: 'Futuristic' },
  { value: 'vintage, retro, nostalgic', label: 'Vintage' },
];

export const STYLE_MEDIUMS = [
  { value: 'photograph', label: 'Photograph' },
  { value: '3D render', label: '3D Render' },
  { value: 'digital illustration', label: 'Digital Illustration' },
  { value: 'oil painting', label: 'Oil Painting' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'cinematic still', label: 'Cinematic' },
];

export const ARTISTIC_STYLES = [
  { value: 'photorealistic, detailed', label: 'Photorealistic' },
  { value: 'minimalist, clean', label: 'Minimalist' },
  { value: 'hyper-detailed, sharp', label: 'Hyper-detailed' },
  { value: 'soft, dreamy', label: 'Soft/Dreamy' },
  { value: 'bold, graphic', label: 'Bold/Graphic' },
  { value: 'cinematic, film-like', label: 'Cinematic' },
];

export const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '4:5', label: 'Portrait (4:5)' },
  { value: '5:4', label: 'Landscape (5:4)' },
  { value: '3:4', label: 'Portrait (3:4)' },
  { value: '4:3', label: 'Landscape (4:3)' },
  { value: '2:3', label: 'Portrait (2:3)' },
  { value: '3:2', label: 'Landscape (3:2)' },
  { value: '9:16', label: 'Story (9:16)' },
  { value: '16:9', label: 'Widescreen (16:9)' },
];

export const DEFAULT_APP_CONFIG: AppConfig = {
  camera: {
    angle: 'eye-level',
    focal_length: 'portrait (85mm)',
    depth_of_field: 'shallow',
    shot_type: 'close-up'
  },
  lighting: {
    conditions: 'bright, even studio lighting',
    direction: 'diffused from multiple sources',
    intensity: 'soft'
  },
  composition: {
    layout: 'centered',
    background: 'clean, seamless white studio backdrop',
    mood: 'elegant, luxurious, sophisticated'
  },
  style: {
    medium: 'photograph',
    artistic_style: 'photorealistic, detailed',
    color_scheme: 'warm, harmonious'
  },
  aspect_ratio: '1:1',
  subject_description: ''
};

// Helper to convert AppConfig to FIBO structured prompt
export function buildStructuredPrompt(
  config: AppConfig,
  subject: string,
  brand: string
): FiboStructuredPrompt {
  return {
    short_description: `A ${config.style.artistic_style} ${config.style.medium} of ${subject} for ${brand}. The scene has a ${config.composition.mood} atmosphere with ${config.lighting.conditions} lighting.`,
    objects: [
      {
        description: subject,
        location: 'center',
        relative_size: 'large within frame',
        shape_and_color: 'As described by the product',
        texture: 'Realistic, detailed surface',
        appearance_details: `High-quality product photography style, ${config.style.artistic_style}`,
      }
    ],
    background_setting: config.composition.background,
    lighting: {
      conditions: config.lighting.conditions,
      direction: config.lighting.direction,
      shadows: 'soft, subtle shadows adding depth'
    },
    aesthetics: {
      composition: `${config.composition.layout} composition`,
      color_scheme: config.style.color_scheme,
      mood_atmosphere: config.composition.mood,
      preference_score: 'very high',
      aesthetic_score: 'very high'
    },
    photographic_characteristics: {
      depth_of_field: config.camera.depth_of_field,
      focus: 'sharp focus on subject',
      camera_angle: config.camera.angle,
      lens_focal_length: config.camera.focal_length
    },
    style_medium: config.style.medium,
    context: `Professional advertising image for ${brand}, targeting premium quality and brand aesthetics.`,
    artistic_style: config.style.artistic_style
  };
}
