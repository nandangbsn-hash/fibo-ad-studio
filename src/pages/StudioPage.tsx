import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Sun, Focus, Gauge, Lock, Unlock, Loader2, Sparkles, ImagePlus, Palette, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import JsonPanel from "@/components/JsonPanel";
import { useImageStore } from "@/hooks/useImageStore";
import { useToast } from "@/hooks/use-toast";
import { 
  CameraSettings, 
  VisualSettings,
  DEFAULT_CAMERA_SETTINGS,
  DEFAULT_VISUAL_SETTINGS,
  CAMERA_BODIES,
  LENS_TYPES,
  SHOT_PRESETS,
  LIGHTING_TYPES,
  COLOR_GRADING_PRESETS,
  MOOD_FILTERS,
} from "@/types/database";
import { FiboStructuredPrompt, ASPECT_RATIOS } from "@/types/fibo";

// Color bit depth options
const COLOR_BIT_DEPTHS = [
  { value: '8', label: '8-bit (Standard)' },
  { value: '10', label: '10-bit (HDR Ready)' },
  { value: '12', label: '12-bit (Professional)' },
  { value: '16', label: '16-bit (Cinema Grade)' },
];

// Color space options
const COLOR_SPACES = [
  { value: 'srgb', label: 'sRGB (Standard)' },
  { value: 'adobe_rgb', label: 'Adobe RGB' },
  { value: 'dci_p3', label: 'DCI-P3 (Wide Gamut)' },
  { value: 'rec2020', label: 'Rec. 2020 (HDR)' },
];

// Tone mapping options
const TONE_MAPPINGS = [
  { value: 'none', label: 'None' },
  { value: 'reinhard', label: 'Reinhard' },
  { value: 'aces', label: 'ACES Filmic' },
  { value: 'hdr10', label: 'HDR10' },
  { value: 'dolby_vision', label: 'Dolby Vision' },
];

// Build complete structured prompt from all settings
const buildCompleteStructuredPrompt = (
  customPrompt: string,
  cameraSettings: CameraSettings,
  visualSettings: VisualSettings
): FiboStructuredPrompt => {
  const cameraBodyMap: Record<string, string> = {
    'cinema': 'cinema_arri_red',
    'dslr': 'dslr_canon_nikon',
    'mirrorless': 'mirrorless_sony',
    'mobile': 'mobile_camera',
  };

  const shotPresetMap: Record<string, string> = {
    'extreme_wide': 'extreme wide shot',
    'wide': 'wide shot',
    'medium': 'medium shot',
    'medium_closeup': 'medium close-up',
    'closeup': 'close-up',
    'extreme_closeup': 'extreme close-up',
    'macro': 'macro shot',
    'top_down': 'top-down shot',
    'low_angle': 'low angle shot',
    'high_angle': 'high angle shot',
    'dutch_angle': 'dutch angle',
    'over_shoulder': 'over-the-shoulder',
    'pov': 'POV shot',
    'isometric': 'isometric view',
  };

  const lightingTypeMap: Record<string, string> = {
    'hard_studio': 'hard_studio',
    'soft_box': 'soft_box',
    'natural_sunlight': 'natural_sunlight',
    'practical': 'practical_lights',
    'neon_rgb': 'neon_rgb',
    'volumetric': 'volumetric_fog',
  };

  const colorSpaceMap: Record<string, string> = {
    'srgb': 'sRGB',
    'adobe_rgb': 'Adobe RGB',
    'dci_p3': 'DCI-P3',
    'rec2020': 'Rec. 2020',
  };

  const depthOfField = cameraSettings.aperture <= 2 ? 'very shallow' :
                       cameraSettings.aperture <= 4 ? 'shallow' :
                       cameraSettings.aperture <= 8 ? 'medium' : 'deep';

  const lightingConditions = cameraSettings.lighting_type === 'hard_studio' ? 'hard studio lighting with sharp shadows' :
                             cameraSettings.lighting_type === 'soft_box' ? 'soft box lighting with gentle gradients' :
                             cameraSettings.lighting_type === 'natural_sunlight' ? 'natural sunlight' :
                             cameraSettings.lighting_type === 'practical' ? 'practical lights' :
                             cameraSettings.lighting_type === 'neon_rgb' ? 'neon RGB lighting' :
                             cameraSettings.lighting_type === 'volumetric' ? 'volumetric fog lighting' : 'studio lighting';

  const shadows = cameraSettings.key_light.softness > 0.5 ? 'soft shadows' : 'hard shadows';

  return {
    short_description: customPrompt || "A photorealistic product photograph with cinematic lighting.",
    objects: [
      {
        description: customPrompt || "Subject as described",
        location: "center",
        relative_size: "large within frame",
        shape_and_color: "As specified in prompt",
        texture: "realistic, detailed surface",
        appearance_details: "High-quality photography style"
      }
    ],
    background_setting: "clean studio backdrop",
    camera_and_lens: {
      camera_body: cameraBodyMap[cameraSettings.camera_body] || cameraSettings.camera_body,
      lens_type: cameraSettings.lens_type,
      focal_length_mm: cameraSettings.focal_length_mm,
      aperture_f_stop: cameraSettings.aperture,
      shot_preset: cameraSettings.shot_preset
    },
    geometry: {
      tilt_degrees: cameraSettings.tilt_angle,
      pan_degrees: cameraSettings.pan_angle,
      roll_degrees: cameraSettings.roll_angle,
      distance_meters: cameraSettings.camera_distance
    },
    lighting: {
      lighting_type: lightingTypeMap[cameraSettings.lighting_type] || cameraSettings.lighting_type,
      key_light: {
        intensity_percent: Math.round(cameraSettings.key_light.intensity * 100),
        softness_percent: Math.round(cameraSettings.key_light.softness * 100),
        temperature_kelvin: cameraSettings.key_light.color_temperature
      },
      fill_light: {
        intensity_percent: Math.round(cameraSettings.fill_light.intensity * 100)
      },
      rim_light: {
        intensity_percent: Math.round(cameraSettings.rim_light.intensity * 100)
      },
      conditions: lightingConditions,
      direction: `key light intensity: ${Math.round(cameraSettings.key_light.intensity * 100)}%`,
      shadows: shadows
    },
    focus_and_motion: {
      focus_distance_meters: cameraSettings.focus_distance,
      shutter_angle_degrees: cameraSettings.shutter_angle,
      shutter_speed: `1/${cameraSettings.shutter_speed}s`,
      depth_of_field: depthOfField,
      focus: cameraSettings.auto_focus ? 'auto focus on subject' : `manual focus at ${cameraSettings.focus_distance}m`
    },
    sensor_and_exposure: {
      iso: cameraSettings.iso,
      exposure_compensation_ev: cameraSettings.exposure_compensation,
      white_balance_kelvin: cameraSettings.white_balance,
      dynamic_range_percent: cameraSettings.dynamic_range
    },
    visual_and_color: {
      hdr_enabled: visualSettings.hdr_enabled,
      color_bit_depth: `${visualSettings.color_bit_depth}-bit`,
      color_space: colorSpaceMap[visualSettings.color_space] || visualSettings.color_space,
      tone_mapping: visualSettings.tone_mapping,
      color_grading: visualSettings.color_grading_preset,
      mood_filter: visualSettings.mood_filter,
      tone_adjustments: {
        brightness_percent: visualSettings.brightness,
        contrast_percent: visualSettings.contrast,
        saturation_percent: visualSettings.saturation,
        vibrance_percent: visualSettings.vibrance,
        clarity_percent: visualSettings.clarity
      },
      luminance_controls: {
        highlights_percent: visualSettings.highlights,
        shadows_percent: visualSettings.shadows,
        whites_percent: visualSettings.whites,
        blacks_percent: visualSettings.blacks
      }
    },
    aesthetics: {
      composition: `${visualSettings.composition_layout} composition`,
      color_scheme: visualSettings.color_palette,
      mood_atmosphere: "professional",
      preference_score: "high",
      aesthetic_score: "high"
    },
    photographic_characteristics: {
      camera_angle: shotPresetMap[cameraSettings.shot_preset] || 'eye-level'
    },
    style_medium: "photograph",
    context: "Professional photography.",
    artistic_style: "photorealistic"
  };
};

const StudioPage = () => {
  const { saveGeneratedImage } = useImageStore();
  const { toast } = useToast();
  
  const [customPrompt, setCustomPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(DEFAULT_VISUAL_SETTINGS);
  const [structuredPrompt, setStructuredPrompt] = useState<FiboStructuredPrompt>(() => 
    buildCompleteStructuredPrompt("", DEFAULT_CAMERA_SETTINGS, DEFAULT_VISUAL_SETTINGS)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lockedParams, setLockedParams] = useState<string[]>([]);

  // Rebuild structured prompt whenever settings change
  useEffect(() => {
    setStructuredPrompt(buildCompleteStructuredPrompt(customPrompt, cameraSettings, visualSettings));
  }, [customPrompt, cameraSettings, visualSettings]);

  // Update a visual setting
  const updateVisualSetting = <K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => {
    setVisualSettings(prev => ({ ...prev, [key]: value }));
  };

  // Update a camera setting
  const updateSetting = <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
    if (lockedParams.includes(key)) return;
    setCameraSettings(prev => ({ ...prev, [key]: value }));
  };

  // Update light setting
  const updateLight = (lightType: 'key_light' | 'fill_light' | 'rim_light', key: string, value: number) => {
    if (lockedParams.includes(`${lightType}.${key}`)) return;
    setCameraSettings(prev => ({
      ...prev,
      [lightType]: { ...prev[lightType], [key]: value }
    }));
  };

  // Toggle lock
  const toggleLock = (param: string) => {
    setLockedParams(prev => 
      prev.includes(param) 
        ? prev.filter(p => p !== param)
        : [...prev, param]
    );
  };

  // Handle custom prompt change
  const handlePromptChange = (value: string) => {
    setCustomPrompt(value);
  };

  // Generate image
  const handleGenerate = async () => {
    if (!customPrompt.trim()) {
      toast({ title: "Please enter a prompt", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fibo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          structured_prompt: structuredPrompt,
          aspect_ratio: aspectRatio,
          sync: true
        }),
      });

      const data = await response.json();
      
      if (data.success && data.image_url) {
        setGeneratedImage(data.image_url);
        
        await saveGeneratedImage(
          data.image_url,
          structuredPrompt,
          aspectRatio,
          data.seed,
          undefined,
          undefined,
          cameraSettings,
          visualSettings,
          'studio',
          undefined
        );

        toast({ title: "Image generated!", description: "Saved to your gallery" });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Error generating:', error);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left - Controls */}
          <div className="lg:col-span-5 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-4"
            >
              <h1 className="text-2xl font-bold mb-2">
                <span className="text-gradient-gold">Camera</span> Studio
              </h1>
              <p className="text-sm text-muted-foreground">
                Custom prompts with advanced camera controls
              </p>
            </motion.div>

            {/* Custom Prompt Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-4 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Image Prompt</Label>
              </div>
              <Textarea
                placeholder="Describe your image... e.g., 'A sleek luxury watch on black velvet, dramatic lighting'"
                value={customPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                className="min-h-[100px] bg-muted/50 border-border/50"
              />
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map(ar => (
                        <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !customPrompt.trim()}
                  className="bg-gradient-gold hover:opacity-90 text-primary-foreground self-end"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ImagePlus className="w-4 h-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
            </motion.div>

            {/* Camera Controls Tabs */}
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="camera"><Camera className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="lighting"><Sun className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="focus"><Focus className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="sensor"><Gauge className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="visual"><Palette className="w-4 h-4" /></TabsTrigger>
              </TabsList>

              {/* Camera Tab */}
              <TabsContent value="camera" className="glass-panel p-4 space-y-4 mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Camera & Lens
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Camera Body</Label>
                    <Select value={cameraSettings.camera_body} onValueChange={v => updateSetting('camera_body', v)}>
                      <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CAMERA_BODIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Lens Type</Label>
                    <Select value={cameraSettings.lens_type} onValueChange={v => updateSetting('lens_type', v)}>
                      <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LENS_TYPES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Focal Length: {cameraSettings.focal_length_mm}mm</Label>
                    <button onClick={() => toggleLock('focal_length_mm')} className="text-muted-foreground hover:text-foreground">
                      {lockedParams.includes('focal_length_mm') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                  <Slider
                    value={[cameraSettings.focal_length_mm]}
                    onValueChange={([v]) => updateSetting('focal_length_mm', v)}
                    min={10} max={300} step={1}
                    disabled={lockedParams.includes('focal_length_mm')}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Aperture: f/{cameraSettings.aperture}</Label>
                    <button onClick={() => toggleLock('aperture')} className="text-muted-foreground hover:text-foreground">
                      {lockedParams.includes('aperture') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                  <Slider
                    value={[cameraSettings.aperture]}
                    onValueChange={([v]) => updateSetting('aperture', v)}
                    min={1.2} max={22} step={0.1}
                    disabled={lockedParams.includes('aperture')}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Shot Preset</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {SHOT_PRESETS.slice(0, 8).map(preset => (
                      <Button
                        key={preset.value}
                        size="sm"
                        variant={cameraSettings.shot_preset === preset.value ? 'default' : 'outline'}
                        onClick={() => updateSetting('shot_preset', preset.value)}
                        className="text-xs h-8"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold pt-4">Geometry</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Tilt: {cameraSettings.tilt_angle}°</Label>
                    <Slider value={[cameraSettings.tilt_angle]} onValueChange={([v]) => updateSetting('tilt_angle', v)} min={-90} max={90} step={1} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Pan: {cameraSettings.pan_angle}°</Label>
                    <Slider value={[cameraSettings.pan_angle]} onValueChange={([v]) => updateSetting('pan_angle', v)} min={-180} max={180} step={1} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Roll: {cameraSettings.roll_angle}°</Label>
                    <Slider value={[cameraSettings.roll_angle]} onValueChange={([v]) => updateSetting('roll_angle', v)} min={-45} max={45} step={1} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Distance: {cameraSettings.camera_distance}m</Label>
                    <Slider value={[cameraSettings.camera_distance]} onValueChange={([v]) => updateSetting('camera_distance', v)} min={0.5} max={20} step={0.1} />
                  </div>
                </div>
              </TabsContent>

              {/* Lighting Tab */}
              <TabsContent value="lighting" className="glass-panel p-4 space-y-4 mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sun className="w-4 h-4 text-primary" />
                  Lighting
                </h3>

                <div className="space-y-2">
                  <Label className="text-xs">Lighting Type</Label>
                  <Select value={cameraSettings.lighting_type} onValueChange={v => updateSetting('lighting_type', v)}>
                    <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIGHTING_TYPES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Key Light</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Intensity: {Math.round(cameraSettings.key_light.intensity * 100)}%</Label>
                    <Slider
                      value={[cameraSettings.key_light.intensity]}
                      onValueChange={([v]) => updateLight('key_light', 'intensity', v)}
                      min={0} max={2} step={0.01}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Softness: {Math.round(cameraSettings.key_light.softness * 100)}%</Label>
                    <Slider
                      value={[cameraSettings.key_light.softness]}
                      onValueChange={([v]) => updateLight('key_light', 'softness', v)}
                      min={0} max={1} step={0.01}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Temperature: {cameraSettings.key_light.color_temperature}K</Label>
                    <Slider
                      value={[cameraSettings.key_light.color_temperature]}
                      onValueChange={([v]) => updateLight('key_light', 'color_temperature', v)}
                      min={2000} max={10000} step={100}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Fill Light</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Intensity: {Math.round(cameraSettings.fill_light.intensity * 100)}%</Label>
                    <Slider
                      value={[cameraSettings.fill_light.intensity]}
                      onValueChange={([v]) => updateLight('fill_light', 'intensity', v)}
                      min={0} max={2} step={0.01}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Rim Light</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Intensity: {Math.round(cameraSettings.rim_light.intensity * 100)}%</Label>
                    <Slider
                      value={[cameraSettings.rim_light.intensity]}
                      onValueChange={([v]) => updateLight('rim_light', 'intensity', v)}
                      min={0} max={2} step={0.01}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Focus Tab */}
              <TabsContent value="focus" className="glass-panel p-4 space-y-4 mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Focus className="w-4 h-4 text-primary" />
                  Focus & Motion
                </h3>

                <div className="space-y-2">
                  <Label className="text-xs">Focus Distance: {cameraSettings.focus_distance}m</Label>
                  <Slider
                    value={[cameraSettings.focus_distance]}
                    onValueChange={([v]) => updateSetting('focus_distance', v)}
                    min={0.1} max={50} step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Shutter Angle: {cameraSettings.shutter_angle}°</Label>
                  <Slider
                    value={[cameraSettings.shutter_angle]}
                    onValueChange={([v]) => updateSetting('shutter_angle', v)}
                    min={1} max={360} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Shutter Speed: 1/{cameraSettings.shutter_speed}s</Label>
                  <Slider
                    value={[cameraSettings.shutter_speed]}
                    onValueChange={([v]) => updateSetting('shutter_speed', v)}
                    min={1} max={4000} step={1}
                  />
                </div>
              </TabsContent>

              {/* Sensor Tab */}
              <TabsContent value="sensor" className="glass-panel p-4 space-y-4 mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Sensor & Exposure
                </h3>

                <div className="space-y-2">
                  <Label className="text-xs">ISO: {cameraSettings.iso}</Label>
                  <Slider
                    value={[cameraSettings.iso]}
                    onValueChange={([v]) => updateSetting('iso', v)}
                    min={50} max={12800} step={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Exposure Compensation: {cameraSettings.exposure_compensation > 0 ? '+' : ''}{cameraSettings.exposure_compensation} EV</Label>
                  <Slider
                    value={[cameraSettings.exposure_compensation]}
                    onValueChange={([v]) => updateSetting('exposure_compensation', v)}
                    min={-3} max={3} step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">White Balance: {cameraSettings.white_balance}K</Label>
                  <Slider
                    value={[cameraSettings.white_balance]}
                    onValueChange={([v]) => updateSetting('white_balance', v)}
                    min={2500} max={10000} step={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Dynamic Range: {cameraSettings.dynamic_range}%</Label>
                  <Slider
                    value={[cameraSettings.dynamic_range]}
                    onValueChange={([v]) => updateSetting('dynamic_range', v)}
                    min={0} max={100} step={1}
                  />
                </div>
              </TabsContent>

              {/* Visual Settings Tab */}
              <TabsContent value="visual" className="glass-panel p-4 space-y-4 mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Visual & Color
                </h3>

                {/* HDR Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-medium">HDR Enabled</Label>
                  </div>
                  <Switch
                    checked={visualSettings.hdr_enabled}
                    onCheckedChange={(v) => updateVisualSetting('hdr_enabled', v)}
                  />
                </div>

                {/* Color Bit Depth */}
                <div className="space-y-2">
                  <Label className="text-xs">Color Bit Depth</Label>
                  <Select value={visualSettings.color_bit_depth} onValueChange={v => updateVisualSetting('color_bit_depth', v)}>
                    <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLOR_BIT_DEPTHS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Space */}
                <div className="space-y-2">
                  <Label className="text-xs">Color Space</Label>
                  <Select value={visualSettings.color_space} onValueChange={v => updateVisualSetting('color_space', v)}>
                    <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLOR_SPACES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone Mapping */}
                <div className="space-y-2">
                  <Label className="text-xs">Tone Mapping</Label>
                  <Select value={visualSettings.tone_mapping} onValueChange={v => updateVisualSetting('tone_mapping', v)}>
                    <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONE_MAPPINGS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color Grading Preset */}
                <div className="space-y-2">
                  <Label className="text-xs">Color Grading</Label>
                  <Select value={visualSettings.color_grading_preset} onValueChange={v => updateVisualSetting('color_grading_preset', v)}>
                    <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLOR_GRADING_PRESETS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mood Filter */}
                <div className="space-y-2">
                  <Label className="text-xs">Mood Filter</Label>
                  <Select value={visualSettings.mood_filter} onValueChange={v => updateVisualSetting('mood_filter', v)}>
                    <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MOOD_FILTERS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <h4 className="text-sm font-medium pt-2">Tone Adjustments</h4>

                <div className="space-y-2">
                  <Label className="text-xs">Brightness: {visualSettings.brightness}%</Label>
                  <Slider
                    value={[visualSettings.brightness]}
                    onValueChange={([v]) => updateVisualSetting('brightness', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Contrast: {visualSettings.contrast}%</Label>
                  <Slider
                    value={[visualSettings.contrast]}
                    onValueChange={([v]) => updateVisualSetting('contrast', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Saturation: {visualSettings.saturation}%</Label>
                  <Slider
                    value={[visualSettings.saturation]}
                    onValueChange={([v]) => updateVisualSetting('saturation', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Vibrance: {visualSettings.vibrance}%</Label>
                  <Slider
                    value={[visualSettings.vibrance]}
                    onValueChange={([v]) => updateVisualSetting('vibrance', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Clarity: {visualSettings.clarity}%</Label>
                  <Slider
                    value={[visualSettings.clarity]}
                    onValueChange={([v]) => updateVisualSetting('clarity', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <h4 className="text-sm font-medium pt-2">Luminance Controls</h4>

                <div className="space-y-2">
                  <Label className="text-xs">Highlights: {visualSettings.highlights}%</Label>
                  <Slider
                    value={[visualSettings.highlights]}
                    onValueChange={([v]) => updateVisualSetting('highlights', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Shadows: {visualSettings.shadows}%</Label>
                  <Slider
                    value={[visualSettings.shadows]}
                    onValueChange={([v]) => updateVisualSetting('shadows', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Whites: {visualSettings.whites}%</Label>
                  <Slider
                    value={[visualSettings.whites]}
                    onValueChange={([v]) => updateVisualSetting('whites', v)}
                    min={0} max={100} step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Blacks: {visualSettings.blacks}%</Label>
                  <Slider
                    value={[visualSettings.blacks]}
                    onValueChange={([v]) => updateVisualSetting('blacks', v)}
                    min={0} max={100} step={1}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right - Preview & JSON */}
          <div className="lg:col-span-7 space-y-4">
            {/* Image Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-4"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Generating with camera settings...</p>
                  </div>
                ) : generatedImage ? (
                  <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center space-y-4 p-8">
                    <Camera className="w-16 h-16 text-muted-foreground/50 mx-auto" />
                    <div>
                      <p className="text-muted-foreground">Enter a prompt and adjust camera settings</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Your image will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* JSON Panel */}
            <JsonPanel
              structuredPrompt={structuredPrompt}
              onChange={setStructuredPrompt}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudioPage;
