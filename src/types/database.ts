// Database types for FIBO Ad Director
import { FiboStructuredPrompt } from "./fibo";

export interface Campaign {
  id: string;
  brand_name: string;
  product_description: string | null;
  target_audience: string | null;
  mood: string | null;
  color_scheme: string | null;
  category: string | null;
  tone: string | null;
  key_values: string[] | null;
  recommended_palette: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAdConcept {
  id: string;
  campaign_id: string | null;
  name: string;
  description: string | null;
  structured_prompt: FiboStructuredPrompt;
  shot_list: string[] | null;
  aspect_ratio: string;
  created_at: string;
  updated_at: string;
}

export interface CameraSettings {
  camera_body: string;
  lens_type: string;
  focal_length_mm: number;
  aperture: number;
  // Geometry
  tilt_angle: number;
  pan_angle: number;
  roll_angle: number;
  camera_height: number;
  camera_distance: number;
  dolly: number;
  crane: number;
  orbit: number;
  // Focus & Motion
  focus_distance: number;
  auto_focus: boolean;
  focus_pull: number;
  motion_blur: boolean;
  shutter_angle: number;
  shutter_speed: number;
  // Lighting
  key_light: LightSettings;
  fill_light: LightSettings;
  rim_light: LightSettings;
  ambient_light: AmbientLightSettings;
  lighting_type: string;
  // Sensor
  iso: number;
  exposure_compensation: number;
  highlight_rolloff: number;
  shadow_crush: number;
  dynamic_range: number;
  white_balance: number;
  // Composition overlays
  rule_of_thirds: boolean;
  golden_ratio: boolean;
  center_frame: boolean;
  leading_lines: boolean;
  safe_area: boolean;
  product_grid: boolean;
  // Locked parameters
  locked: string[];
  // Shot framing preset
  shot_preset: string;
}

export interface LightSettings {
  position_x: number;
  position_y: number;
  position_z: number;
  intensity: number;
  softness: number;
  color_temperature: number;
}

export interface AmbientLightSettings {
  intensity: number;
  color_temperature: number;
}

export interface VisualSettings {
  composition_layout: string;
  color_palette: string;
  contrast: number;
  saturation: number;
  brightness: number;
  hdr_enabled: boolean;
  aspect_ratio: string;
  export_width: number;
  export_height: number;
  color_grading_preset: string;
  mood_filter: string;
  // Extended visual settings
  color_bit_depth: string;
  color_space: string;
  tone_mapping: string;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  vibrance: number;
  clarity: number;
}

export interface GeneratedImageDb {
  id: string;
  campaign_id: string | null;
  concept_id: string | null;
  user_id?: string | null;
  image_url: string;
  seed: number | null;
  structured_prompt: FiboStructuredPrompt;
  aspect_ratio: string;
  version: number;
  parent_image_id: string | null;
  camera_settings: CameraSettings | null;
  visual_settings: VisualSettings | null;
  generation_type: 'initial' | 'camera_edit' | 'visual_edit' | 'studio';
  is_public?: boolean;
  created_at: string;
}

// Feed item with related data
export interface FeedItem extends GeneratedImageDb {
  campaign?: Campaign;
  concept?: DbAdConcept;
}

// Default camera settings
export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  camera_body: 'cinema',
  lens_type: 'prime',
  focal_length_mm: 85,
  aperture: 2.8,
  tilt_angle: 0,
  pan_angle: 0,
  roll_angle: 0,
  camera_height: 1.5,
  camera_distance: 3,
  dolly: 0,
  crane: 0,
  orbit: 0,
  focus_distance: 3,
  auto_focus: true,
  focus_pull: 0,
  motion_blur: false,
  shutter_angle: 180,
  shutter_speed: 50,
  key_light: { position_x: -2, position_y: 2, position_z: 2, intensity: 1, softness: 0.5, color_temperature: 5600 },
  fill_light: { position_x: 2, position_y: 1, position_z: 1, intensity: 0.5, softness: 0.7, color_temperature: 5600 },
  rim_light: { position_x: 0, position_y: 2, position_z: -2, intensity: 0.7, softness: 0.3, color_temperature: 5600 },
  ambient_light: { intensity: 0.3, color_temperature: 5600 },
  lighting_type: 'soft_box',
  iso: 400,
  exposure_compensation: 0,
  highlight_rolloff: 50,
  shadow_crush: 20,
  dynamic_range: 80,
  white_balance: 5600,
  rule_of_thirds: true,
  golden_ratio: false,
  center_frame: false,
  leading_lines: false,
  safe_area: false,
  product_grid: false,
  locked: [],
  shot_preset: 'medium',
};

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  composition_layout: 'centered',
  color_palette: 'neutral',
  contrast: 50,
  saturation: 50,
  brightness: 50,
  hdr_enabled: false,
  aspect_ratio: '1:1',
  export_width: 1024,
  export_height: 1024,
  color_grading_preset: 'none',
  mood_filter: 'none',
  color_bit_depth: '8',
  color_space: 'srgb',
  tone_mapping: 'none',
  highlights: 50,
  shadows: 50,
  whites: 50,
  blacks: 50,
  vibrance: 50,
  clarity: 50,
};

// Camera presets
export const CAMERA_BODIES = [
  { value: 'cinema', label: 'Cinema (ARRI/RED)' },
  { value: 'dslr', label: 'DSLR' },
  { value: 'mirrorless', label: 'Mirrorless' },
  { value: 'mobile', label: 'Mobile Camera' },
];

export const LENS_TYPES = [
  { value: 'prime', label: 'Prime' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'anamorphic', label: 'Anamorphic' },
  { value: 'fisheye', label: 'Fisheye' },
];

export const SHOT_PRESETS = [
  { value: 'extreme_wide', label: 'Extreme Wide' },
  { value: 'wide', label: 'Wide' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium_closeup', label: 'Medium Close-Up' },
  { value: 'closeup', label: 'Close-Up' },
  { value: 'extreme_closeup', label: 'Extreme Close-Up' },
  { value: 'macro', label: 'Macro' },
  { value: 'over_shoulder', label: 'Over-the-Shoulder' },
  { value: 'pov', label: 'POV Shot' },
  { value: 'top_down', label: 'Top-Down' },
  { value: 'low_angle', label: 'Low-Angle' },
  { value: 'high_angle', label: 'High-Angle' },
  { value: 'dutch_angle', label: 'Dutch Angle' },
  { value: 'isometric', label: 'Isometric' },
];

export const LIGHTING_TYPES = [
  { value: 'hard_studio', label: 'Hard Studio' },
  { value: 'soft_box', label: 'Soft Box' },
  { value: 'natural_sunlight', label: 'Natural Sunlight' },
  { value: 'practical', label: 'Practical Lights' },
  { value: 'neon_rgb', label: 'Neon / RGB' },
  { value: 'volumetric', label: 'Volumetric Fog Light' },
];

export const COLOR_GRADING_PRESETS = [
  { value: 'none', label: 'None' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'muted', label: 'Muted' },
  { value: 'monochrome', label: 'Monochrome' },
];

export const MOOD_FILTERS = [
  { value: 'none', label: 'None' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'soft', label: 'Soft' },
  { value: 'punchy', label: 'Punchy' },
];
