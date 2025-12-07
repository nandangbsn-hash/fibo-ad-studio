import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Sun, Focus, Gauge, Grid3X3, Lock, Unlock, Loader2, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useImageStore } from "@/hooks/useImageStore";
import { useToast } from "@/hooks/use-toast";
import { 
  CameraSettings, 
  VisualSettings,
  DEFAULT_CAMERA_SETTINGS,
  CAMERA_BODIES,
  LENS_TYPES,
  SHOT_PRESETS,
  LIGHTING_TYPES,
  GeneratedImageDb
} from "@/types/database";
import { FiboStructuredPrompt, buildStructuredPrompt, DEFAULT_APP_CONFIG } from "@/types/fibo";

const CameraDirectorPage = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const { saveGeneratedImage } = useImageStore();
  const { toast } = useToast();
  
  const [image, setImage] = useState<GeneratedImageDb | null>(null);
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>(DEFAULT_CAMERA_SETTINGS);
  const [structuredPrompt, setStructuredPrompt] = useState<FiboStructuredPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lockedParams, setLockedParams] = useState<string[]>([]);

  // Fetch image data
  useEffect(() => {
    const fetchImage = async () => {
      if (!imageId) return;
      
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('id', imageId)
        .single();

      if (error) {
        toast({ title: "Image not found", variant: "destructive" });
        navigate('/feed');
        return;
      }

      const typedImage: GeneratedImageDb = {
        ...data,
        structured_prompt: data.structured_prompt as unknown as FiboStructuredPrompt,
        camera_settings: data.camera_settings as unknown as CameraSettings,
        visual_settings: data.visual_settings as unknown as VisualSettings,
        generation_type: data.generation_type as GeneratedImageDb['generation_type'],
      };
      
      setImage(typedImage);
      setStructuredPrompt(typedImage.structured_prompt);
      if (typedImage.camera_settings) {
        setCameraSettings(typedImage.camera_settings);
        setLockedParams(typedImage.camera_settings.locked || []);
      }
      setIsLoading(false);
    };

    fetchImage();
  }, [imageId, navigate, toast]);

  // Update a camera setting
  const updateSetting = <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
    if (lockedParams.includes(key)) return;
    setCameraSettings(prev => ({ ...prev, [key]: value }));
    updatePromptFromCamera({ ...cameraSettings, [key]: value });
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
    setCameraSettings(prev => ({
      ...prev,
      locked: lockedParams.includes(param)
        ? lockedParams.filter(p => p !== param)
        : [...lockedParams, param]
    }));
  };

  // Update structured prompt based on camera settings
  const updatePromptFromCamera = (settings: CameraSettings) => {
    if (!structuredPrompt) return;
    
    const focalLengthMap: Record<string, string> = {
      '10': 'ultra wide (10mm)',
      '24': 'wide (24mm)',
      '35': 'standard (35mm)',
      '50': 'standard (50mm)',
      '85': 'portrait (85mm)',
      '135': 'telephoto (135mm)',
      '200': 'telephoto (200mm)',
      '300': 'telephoto (300mm)',
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
      'over_shoulder': 'over-the-shoulder shot',
      'pov': 'POV shot',
      'top_down': 'top-down shot',
      'low_angle': 'low angle shot',
      'high_angle': 'high angle shot',
      'dutch_angle': 'dutch angle',
      'isometric': 'isometric view',
    };

    const lightingMap: Record<string, string> = {
      'hard_studio': 'hard studio lighting with sharp shadows',
      'soft_box': 'soft box lighting with gentle gradients',
      'natural_sunlight': 'natural sunlight',
      'practical': 'practical lights with realistic sources',
      'neon_rgb': 'neon RGB lighting with vibrant colors',
      'volumetric': 'volumetric fog lighting with atmospheric depth',
    };

    const depthOfField = settings.aperture <= 2 ? 'very shallow' :
                         settings.aperture <= 4 ? 'shallow' :
                         settings.aperture <= 8 ? 'medium' : 'deep';

    const updatedPrompt: FiboStructuredPrompt = {
      ...structuredPrompt,
      photographic_characteristics: {
        ...structuredPrompt.photographic_characteristics,
        depth_of_field: `${depthOfField} (f/${settings.aperture})`,
        camera_angle: `${angleMap[settings.shot_preset] || 'medium shot'}, tilt: ${settings.tilt_angle}°, pan: ${settings.pan_angle}°, roll: ${settings.roll_angle}°`,
        lens_focal_length: focalLengthMap[closestFocal] || `${settings.focal_length_mm}mm`,
        focus: settings.auto_focus ? 'auto focus on subject' : `manual focus at ${settings.focus_distance}m`,
      },
      lighting: {
        conditions: lightingMap[settings.lighting_type] || 'studio lighting',
        direction: `key light from ${settings.key_light.position_x < 0 ? 'left' : 'right'}, intensity: ${Math.round(settings.key_light.intensity * 100)}%`,
        shadows: settings.key_light.softness > 0.5 ? 'soft, diffused shadows' : 'hard, defined shadows',
      },
    };

    setStructuredPrompt(updatedPrompt);
  };

  // Regenerate with camera changes
  const handleRegenerate = async () => {
    if (!structuredPrompt || !image) return;
    
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
          aspect_ratio: image.aspect_ratio,
          sync: true
        }),
      });

      const data = await response.json();
      
      if (data.success && data.image_url) {
        const savedImage = await saveGeneratedImage(
          data.image_url,
          structuredPrompt,
          image.aspect_ratio,
          data.seed,
          image.campaign_id || undefined,
          image.concept_id || undefined,
          cameraSettings,
          image.visual_settings || undefined,
          'camera_edit',
          image.id
        );

        if (savedImage) {
          toast({ title: "Image regenerated!", description: `Version ${savedImage.version} created` });
          navigate(`/camera-director/${savedImage.id}`);
        }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/feed')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left - Controls */}
          <div className="lg:col-span-5 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-4"
            >
              <h1 className="text-2xl font-bold mb-2">
                <span className="text-gradient-gold">Camera</span> Director
              </h1>
              <p className="text-sm text-muted-foreground">
                Cinematography-grade controls. Changes update JSON in real-time.
              </p>
            </motion.div>

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
                    className="slider-gold"
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
                    className="slider-gold"
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
                  <div className="grid grid-cols-3 gap-1">
                    {SHOT_PRESETS.slice(8).map(preset => (
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

                <h3 className="font-semibold pt-4">Geometry Controls</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Tilt: {cameraSettings.tilt_angle}°</Label>
                    <Slider value={[cameraSettings.tilt_angle]} onValueChange={([v]) => updateSetting('tilt_angle', v)} min={-90} max={90} step={1} className="slider-gold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Pan: {cameraSettings.pan_angle}°</Label>
                    <Slider value={[cameraSettings.pan_angle]} onValueChange={([v]) => updateSetting('pan_angle', v)} min={-180} max={180} step={1} className="slider-gold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Roll: {cameraSettings.roll_angle}°</Label>
                    <Slider value={[cameraSettings.roll_angle]} onValueChange={([v]) => updateSetting('roll_angle', v)} min={-45} max={45} step={1} className="slider-gold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Height: {cameraSettings.camera_height}m</Label>
                    <Slider value={[cameraSettings.camera_height]} onValueChange={([v]) => updateSetting('camera_height', v)} min={0.1} max={10} step={0.1} className="slider-gold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Distance: {cameraSettings.camera_distance}m</Label>
                    <Slider value={[cameraSettings.camera_distance]} onValueChange={([v]) => updateSetting('camera_distance', v)} min={0.5} max={20} step={0.1} className="slider-gold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Orbit: {cameraSettings.orbit}°</Label>
                    <Slider value={[cameraSettings.orbit]} onValueChange={([v]) => updateSetting('orbit', v)} min={-180} max={180} step={1} className="slider-gold" />
                  </div>
                </div>
              </TabsContent>

              {/* Lighting Tab */}
              <TabsContent value="lighting" className="glass-panel p-4 space-y-4 mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sun className="w-4 h-4 text-primary" />
                  Lighting Controls
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

                {/* Key Light */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Key Light</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Intensity: {Math.round(cameraSettings.key_light.intensity * 100)}%</Label>
                      <Slider value={[cameraSettings.key_light.intensity]} onValueChange={([v]) => updateLight('key_light', 'intensity', v)} min={0} max={1} step={0.01} className="slider-gold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Softness: {Math.round(cameraSettings.key_light.softness * 100)}%</Label>
                      <Slider value={[cameraSettings.key_light.softness]} onValueChange={([v]) => updateLight('key_light', 'softness', v)} min={0} max={1} step={0.01} className="slider-gold" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Color Temp: {cameraSettings.key_light.color_temperature}K</Label>
                      <Slider value={[cameraSettings.key_light.color_temperature]} onValueChange={([v]) => updateLight('key_light', 'color_temperature', v)} min={2000} max={10000} step={100} className="slider-gold" />
                    </div>
                  </div>
                </div>

                {/* Fill Light */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Fill Light</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Intensity: {Math.round(cameraSettings.fill_light.intensity * 100)}%</Label>
                      <Slider value={[cameraSettings.fill_light.intensity]} onValueChange={([v]) => updateLight('fill_light', 'intensity', v)} min={0} max={1} step={0.01} className="slider-gold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Softness: {Math.round(cameraSettings.fill_light.softness * 100)}%</Label>
                      <Slider value={[cameraSettings.fill_light.softness]} onValueChange={([v]) => updateLight('fill_light', 'softness', v)} min={0} max={1} step={0.01} className="slider-gold" />
                    </div>
                  </div>
                </div>

                {/* Rim Light */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Rim / Back Light</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Intensity: {Math.round(cameraSettings.rim_light.intensity * 100)}%</Label>
                      <Slider value={[cameraSettings.rim_light.intensity]} onValueChange={([v]) => updateLight('rim_light', 'intensity', v)} min={0} max={1} step={0.01} className="slider-gold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Softness: {Math.round(cameraSettings.rim_light.softness * 100)}%</Label>
                      <Slider value={[cameraSettings.rim_light.softness]} onValueChange={([v]) => updateLight('rim_light', 'softness', v)} min={0} max={1} step={0.01} className="slider-gold" />
                    </div>
                  </div>
                </div>

                {/* Ambient */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <h4 className="text-sm font-medium">Ambient Light</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Intensity: {Math.round(cameraSettings.ambient_light.intensity * 100)}%</Label>
                      <Slider value={[cameraSettings.ambient_light.intensity]} onValueChange={([v]) => setCameraSettings(prev => ({ ...prev, ambient_light: { ...prev.ambient_light, intensity: v } }))} min={0} max={1} step={0.01} className="slider-gold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Color Temp: {cameraSettings.ambient_light.color_temperature}K</Label>
                      <Slider value={[cameraSettings.ambient_light.color_temperature]} onValueChange={([v]) => setCameraSettings(prev => ({ ...prev, ambient_light: { ...prev.ambient_light, color_temperature: v } }))} min={2000} max={10000} step={100} className="slider-gold" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Focus Tab */}
              <TabsContent value="focus" className="glass-panel p-4 space-y-4 mt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Focus className="w-4 h-4 text-primary" />
                  Focus & Motion
                </h3>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <Label>Auto Focus</Label>
                  <Switch checked={cameraSettings.auto_focus} onCheckedChange={v => updateSetting('auto_focus', v)} />
                </div>

                {!cameraSettings.auto_focus && (
                  <div className="space-y-2">
                    <Label className="text-xs">Focus Distance: {cameraSettings.focus_distance}m</Label>
                    <Slider value={[cameraSettings.focus_distance]} onValueChange={([v]) => updateSetting('focus_distance', v)} min={0.3} max={30} step={0.1} className="slider-gold" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Focus Pull (A→B): {cameraSettings.focus_pull}%</Label>
                  <Slider value={[cameraSettings.focus_pull]} onValueChange={([v]) => updateSetting('focus_pull', v)} min={0} max={100} step={1} className="slider-gold" />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <Label>Motion Blur</Label>
                  <Switch checked={cameraSettings.motion_blur} onCheckedChange={v => updateSetting('motion_blur', v)} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Shutter Angle: {cameraSettings.shutter_angle}°</Label>
                  <Slider value={[cameraSettings.shutter_angle]} onValueChange={([v]) => updateSetting('shutter_angle', v)} min={1} max={360} step={1} className="slider-gold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Shutter Speed: 1/{cameraSettings.shutter_speed}</Label>
                  <Slider value={[cameraSettings.shutter_speed]} onValueChange={([v]) => updateSetting('shutter_speed', v)} min={24} max={8000} step={1} className="slider-gold" />
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
                  <Slider value={[cameraSettings.iso]} onValueChange={([v]) => updateSetting('iso', v)} min={50} max={12800} step={50} className="slider-gold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Exposure Comp: {cameraSettings.exposure_compensation > 0 ? '+' : ''}{cameraSettings.exposure_compensation} EV</Label>
                  <Slider value={[cameraSettings.exposure_compensation]} onValueChange={([v]) => updateSetting('exposure_compensation', v)} min={-5} max={5} step={0.1} className="slider-gold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Highlight Roll-off: {cameraSettings.highlight_rolloff}%</Label>
                  <Slider value={[cameraSettings.highlight_rolloff]} onValueChange={([v]) => updateSetting('highlight_rolloff', v)} min={0} max={100} step={1} className="slider-gold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Shadow Crush: {cameraSettings.shadow_crush}%</Label>
                  <Slider value={[cameraSettings.shadow_crush]} onValueChange={([v]) => updateSetting('shadow_crush', v)} min={0} max={100} step={1} className="slider-gold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Dynamic Range: {cameraSettings.dynamic_range}%</Label>
                  <Slider value={[cameraSettings.dynamic_range]} onValueChange={([v]) => updateSetting('dynamic_range', v)} min={0} max={100} step={1} className="slider-gold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">White Balance: {cameraSettings.white_balance}K</Label>
                  <Slider value={[cameraSettings.white_balance]} onValueChange={([v]) => updateSetting('white_balance', v)} min={2000} max={10000} step={100} className="slider-gold" />
                </div>

                <h3 className="font-semibold pt-4 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-primary" />
                  Composition Overlays
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'rule_of_thirds', label: 'Rule of Thirds' },
                    { key: 'golden_ratio', label: 'Golden Ratio' },
                    { key: 'center_frame', label: 'Center Frame' },
                    { key: 'leading_lines', label: 'Leading Lines' },
                    { key: 'safe_area', label: 'Safe Area' },
                    { key: 'product_grid', label: 'Product Grid' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <Label className="text-xs">{label}</Label>
                      <Switch 
                        checked={cameraSettings[key as keyof CameraSettings] as boolean} 
                        onCheckedChange={v => updateSetting(key as keyof CameraSettings, v as any)} 
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Regenerate Button */}
            <Button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-gold text-primary-foreground font-semibold glow-gold btn-premium h-12"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Re-render with Camera Changes
                </>
              )}
            </Button>
          </div>

          {/* Right - Preview & JSON */}
          <div className="lg:col-span-7 space-y-4">
            {/* Image Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-4"
            >
              <div className="relative aspect-square bg-muted/30 rounded-xl overflow-hidden">
                {image && (
                  <img
                    src={image.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">Regenerating with FIBO...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Live JSON Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-4"
            >
              <h3 className="font-semibold mb-3">Live FIBO JSON</h3>
              <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-64 text-muted-foreground">
                {JSON.stringify(structuredPrompt, null, 2)}
              </pre>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CameraDirectorPage;
