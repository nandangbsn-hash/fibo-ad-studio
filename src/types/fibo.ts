export interface FiboCamera {
  angle: number;
  fov: number;
  distance: number;
  shot: string;
  preset: string;
}

export interface FiboLighting {
  type: string;
  intensity: number;
  position: string;
  color_temperature: number;
}

export interface FiboComposition {
  framing: string;
  background: string;
  depth_of_field: string;
}

export interface FiboStyle {
  color_palette: string;
  contrast: string;
  hdr: boolean;
  grain: string;
}

export interface FiboSubject {
  type: string;
  name: string;
  brand: string;
  position: string;
  context: string;
}

export interface FiboAdIntent {
  mood: string;
  target_audience: string;
  format: string;
  copy_direction: string;
}

export interface FiboConfig {
  model: string;
  input: {
    camera: FiboCamera;
    lighting: FiboLighting;
    composition: FiboComposition;
    style: FiboStyle;
    subject: FiboSubject;
    ad_intent: FiboAdIntent;
  };
}

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
  fibo_config: FiboConfig;
  shot_list: string[];
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
}

export const SHOT_PRESETS = [
  { value: 'ultra_wide', label: 'Ultra Wide' },
  { value: 'close_up', label: 'Close-up' },
  { value: 'macro', label: 'Macro' },
  { value: 'dutch_angle', label: 'Dutch Angle' },
  { value: 'low_angle', label: 'Low Angle' },
  { value: 'top_down', label: 'Top-down' },
  { value: 'isometric', label: 'Isometric' },
  { value: 'hero_product', label: 'Hero Product' },
];

export const LIGHTING_TYPES = [
  { value: 'studio_soft', label: 'Studio Soft' },
  { value: 'natural_sunlight', label: 'Natural Sunlight' },
  { value: 'hard_shadow', label: 'Hard Shadow' },
  { value: 'ambient_low', label: 'Ambient Low' },
  { value: 'stage_spotlight', label: 'Stage Spotlight' },
  { value: 'golden_hour', label: 'Golden Hour' },
  { value: 'neon', label: 'Neon' },
];

export const COMPOSITION_TYPES = [
  { value: 'rule_of_thirds', label: 'Rule of Thirds' },
  { value: 'centered', label: 'Centered' },
  { value: 'leading_lines', label: 'Leading Lines' },
  { value: 'symmetric', label: 'Symmetric' },
  { value: 'golden_ratio', label: 'Golden Ratio' },
];

export const BACKGROUND_TYPES = [
  { value: 'minimal_white', label: 'Minimal White' },
  { value: 'minimal_black', label: 'Minimal Black' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'studio', label: 'Studio' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'abstract', label: 'Abstract' },
];

export const DEPTH_OF_FIELD_TYPES = [
  { value: 'shallow', label: 'Shallow (Bokeh)' },
  { value: 'medium', label: 'Medium' },
  { value: 'deep', label: 'Deep (All in focus)' },
];

export const CONTRAST_TYPES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium_high', label: 'Medium High' },
  { value: 'high', label: 'High' },
];

export const GRAIN_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy (Film)' },
];

export const AD_FORMATS = [
  { value: 'instagram_1x1', label: 'Instagram Square (1:1)' },
  { value: 'instagram_4x5', label: 'Instagram Portrait (4:5)' },
  { value: 'instagram_story', label: 'Instagram Story (9:16)' },
  { value: 'facebook_feed', label: 'Facebook Feed' },
  { value: 'twitter_card', label: 'Twitter Card' },
  { value: 'youtube_thumbnail', label: 'YouTube Thumbnail' },
  { value: 'billboard', label: 'Billboard (16:9)' },
];

export const DEFAULT_FIBO_CONFIG: FiboConfig = {
  model: "fibo-image-1",
  input: {
    camera: {
      angle: 35,
      fov: 28,
      distance: 1.2,
      shot: "close_up",
      preset: "hero_product"
    },
    lighting: {
      type: "studio_soft",
      intensity: 0.85,
      position: "front_top",
      color_temperature: 5200
    },
    composition: {
      framing: "rule_of_thirds",
      background: "minimal_white",
      depth_of_field: "shallow"
    },
    style: {
      color_palette: "brand_warm_luxury",
      contrast: "medium_high",
      hdr: true,
      grain: "none"
    },
    subject: {
      type: "physical_product",
      name: "Premium Product",
      brand: "BRAND",
      position: "center",
      context: "premium lifestyle advertising"
    },
    ad_intent: {
      mood: "sleek, luxurious, precision-engineered",
      target_audience: "urban premium buyers",
      format: "instagram_1x1",
      copy_direction: "minimal, clean, high-end aesthetic"
    }
  }
};
