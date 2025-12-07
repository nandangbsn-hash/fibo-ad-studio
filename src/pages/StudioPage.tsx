import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Sun, Focus, Gauge, Lock, Unlock, Loader2, Sparkles, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import JsonPanel from "@/components/JsonPanel";
import { useImageStore } from "@/hooks/useImageStore";
import { useToast } from "@/hooks/use-toast";
import { 
  CameraSettings, 
  DEFAULT_CAMERA_SETTINGS,
  CAMERA_BODIES,
  LENS_TYPES,
  SHOT_PRESETS,
  LIGHTING_TYPES,
} from "@/types/database";
import { FiboStructuredPrompt, ASPECT_RATIOS } from "@/types/fibo";

const DEFAULT_STUDIO_PROMPT: FiboStructuredPrompt = {
  short_description: "A photorealistic product photograph with cinematic lighting.",
  objects: [
    {
      description: "Subject as described",
      location: "center",
      relative_size: "large within frame",
      shape_and_color: "As specified in prompt",
      texture: "realistic, detailed surface",
      appearance_details: "High-quality photography style"
    }
  ],
  background_setting: "clean studio backdrop",
  lighting: {
    conditions: "studio lighting",
    direction: "diffused from multiple sources",
    shadows: "soft shadows"
  },
  aesthetics: {
    composition: "centered composition",
    color_scheme: "neutral",
    mood_atmosphere: "professional",
    preference_score: "high",
    aesthetic_score: "high"
  },
  photographic_characteristics: {
    depth_of_field: "shallow",
    focus: "sharp focus on subject",
    camera_angle: "eye-level",
    lens_focal_length: "85mm"
  },
  style_medium: "photograph",
  context: "Professional photography.",
  artistic_style: "photorealistic"
};

const StudioPage = () => {
  const { saveGeneratedImage } = useImageStore();
  const { toast } = useToast();
  
  const [customPrompt, setCustomPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [structuredPrompt, setStructuredPrompt] = useState<FiboStructuredPrompt>(DEFAULT_STUDIO_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lockedParams, setLockedParams] = useState<string[]>([]);

  // Update a camera setting
  const updateSetting = <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
    if (lockedParams.includes(key)) return;
    const newSettings = { ...cameraSettings, [key]: value };
    setCameraSettings(newSettings);
    updatePromptFromCamera(newSettings);
  };

  // Update light setting
  const updateLight = (lightType: 'key_light' | 'fill_light' | 'rim_light', key: string, value: number) => {
    if (lockedParams.includes(`${lightType}.${key}`)) return;
    const newSettings = {
      ...cameraSettings,
      [lightType]: { ...cameraSettings[lightType], [key]: value }
    };
    setCameraSettings(newSettings);
    updatePromptFromCamera(newSettings);
  };

  // Toggle lock
  const toggleLock = (param: string) => {
    setLockedParams(prev => 
      prev.includes(param) 
        ? prev.filter(p => p !== param)
        : [...prev, param]
    );
  };

  // Update structured prompt based on camera settings
  const updatePromptFromCamera = (settings: CameraSettings) => {
    const focalLengthMap: Record<string, string> = {
      '10': 'ultra wide (10mm)',
      '24': 'wide (24mm)',
      '35': 'standard (35mm)',
      '50': 'standard (50mm)',
      '85': 'portrait (85mm)',
      '135': 'telephoto (135mm)',
      '200': 'telephoto (200mm)',
    };
    const closestFocal = Object.keys(focalLengthMap).reduce((prev, curr) => 
      Math.abs(parseInt(curr) - settings.focal_length_mm) < Math.abs(parseInt(prev) - settings.focal_length_mm) ? curr : prev
    );

    const angleMap: Record<string, string> = {
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
    };

    const lightingMap: Record<string, string> = {
      'hard_studio': 'hard studio lighting with sharp shadows',
      'soft_box': 'soft box lighting with gentle gradients',
      'natural_sunlight': 'natural sunlight',
      'practical': 'practical lights',
      'neon_rgb': 'neon RGB lighting',
      'volumetric': 'volumetric fog lighting',
    };

    const depthOfField = settings.aperture <= 2 ? 'very shallow' :
                         settings.aperture <= 4 ? 'shallow' :
                         settings.aperture <= 8 ? 'medium' : 'deep';

    // Update structured prompt with custom prompt as short description
    setStructuredPrompt(prev => ({
      ...prev,
      short_description: customPrompt || prev.short_description,
      objects: prev.objects.map((obj, i) => i === 0 ? { ...obj, description: customPrompt || obj.description } : obj),
      photographic_characteristics: {
        depth_of_field: `${depthOfField} (f/${settings.aperture})`,
        camera_angle: `${angleMap[settings.shot_preset] || 'medium shot'}, tilt: ${settings.tilt_angle}°`,
        lens_focal_length: focalLengthMap[closestFocal] || `${settings.focal_length_mm}mm`,
        focus: settings.auto_focus ? 'auto focus on subject' : `manual focus at ${settings.focus_distance}m`,
      },
      lighting: {
        conditions: lightingMap[settings.lighting_type] || 'studio lighting',
        direction: `key light intensity: ${Math.round(settings.key_light.intensity * 100)}%`,
        shadows: settings.key_light.softness > 0.5 ? 'soft, diffused shadows' : 'hard, defined shadows',
      },
    }));
  };

  // Handle custom prompt change
  const handlePromptChange = (value: string) => {
    setCustomPrompt(value);
    setStructuredPrompt(prev => ({
      ...prev,
      short_description: value || DEFAULT_STUDIO_PROMPT.short_description,
      objects: prev.objects.map((obj, i) => i === 0 ? { ...obj, description: value || "Subject as described" } : obj),
    }));
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
          undefined,
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
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="camera"><Camera className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="lighting"><Sun className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="focus"><Focus className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="sensor"><Gauge className="w-4 h-4" /></TabsTrigger>
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
