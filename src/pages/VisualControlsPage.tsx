import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, SunMedium, Contrast, Aperture, Download, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useImageStore } from "@/hooks/useImageStore";
import { useToast } from "@/hooks/use-toast";
import { 
  VisualSettings,
  CameraSettings,
  DEFAULT_VISUAL_SETTINGS,
  COLOR_GRADING_PRESETS,
  MOOD_FILTERS,
  GeneratedImageDb
} from "@/types/database";
import { FiboStructuredPrompt, ASPECT_RATIOS, COMPOSITION_LAYOUTS, MOOD_ATMOSPHERES } from "@/types/fibo";

const VisualControlsPage = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const { saveGeneratedImage } = useImageStore();
  const { toast } = useToast();
  
  const [image, setImage] = useState<GeneratedImageDb | null>(null);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(DEFAULT_VISUAL_SETTINGS);
  const [structuredPrompt, setStructuredPrompt] = useState<FiboStructuredPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

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
      if (typedImage.visual_settings) {
        setVisualSettings(typedImage.visual_settings);
      }
      setIsLoading(false);
    };

    fetchImage();
  }, [imageId, navigate, toast]);

  // Update a visual setting
  const updateSetting = <K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => {
    setVisualSettings(prev => ({ ...prev, [key]: value }));
    updatePromptFromVisuals({ ...visualSettings, [key]: value });
  };

  // Update structured prompt based on visual settings
  const updatePromptFromVisuals = (settings: VisualSettings) => {
    if (!structuredPrompt) return;

    const moodMap: Record<string, string> = {
      'none': structuredPrompt.aesthetics.mood_atmosphere,
      'warm': 'warm, inviting, cozy atmosphere',
      'cool': 'cool, calm, serene atmosphere',
      'dramatic': 'dramatic, intense, bold atmosphere',
      'soft': 'soft, gentle, delicate atmosphere',
      'punchy': 'punchy, vibrant, energetic atmosphere',
    };

    const gradingMap: Record<string, string> = {
      'none': '',
      'cinematic': ', cinematic color grading with teal and orange tones',
      'vintage': ', vintage film look with faded blacks and warm highlights',
      'vibrant': ', vibrant and saturated colors',
      'muted': ', muted, desaturated color palette',
      'monochrome': ', black and white monochrome',
    };

    const updatedPrompt: FiboStructuredPrompt = {
      ...structuredPrompt,
      aesthetics: {
        ...structuredPrompt.aesthetics,
        composition: `${settings.composition_layout} composition`,
        color_scheme: `${settings.color_palette}${gradingMap[settings.color_grading_preset] || ''}`,
        mood_atmosphere: moodMap[settings.mood_filter] || structuredPrompt.aesthetics.mood_atmosphere,
      },
      short_description: `${structuredPrompt.short_description}${settings.hdr_enabled ? ' HDR enabled with high dynamic range.' : ''}`,
    };

    setStructuredPrompt(updatedPrompt);
  };

  // Calculate export dimensions
  const getExportDimensions = (aspectRatio: string): { width: number; height: number } => {
    const baseSize = 1024;
    const [w, h] = aspectRatio.split(':').map(Number);
    if (w > h) {
      return { width: baseSize, height: Math.round(baseSize * (h / w)) };
    } else {
      return { width: Math.round(baseSize * (w / h)), height: baseSize };
    }
  };

  // Regenerate with visual changes
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
          aspect_ratio: visualSettings.aspect_ratio,
          sync: true
        }),
      });

      const data = await response.json();
      
      if (data.success && data.image_url) {
        const savedImage = await saveGeneratedImage(
          data.image_url,
          structuredPrompt,
          visualSettings.aspect_ratio,
          data.seed,
          image.campaign_id || undefined,
          image.concept_id || undefined,
          image.camera_settings || undefined,
          visualSettings,
          'visual_edit',
          image.id
        );

        if (savedImage) {
          toast({ title: "Image regenerated!", description: `Version ${savedImage.version} created` });
          navigate(`/visual-controls/${savedImage.id}`);
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

  const exportDims = getExportDimensions(visualSettings.aspect_ratio);

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
                <span className="text-gradient-gold">Visual</span> Controls
              </h1>
              <p className="text-sm text-muted-foreground">
                Composition, color, and export settings. Changes update JSON in real-time.
              </p>
            </motion.div>

            {/* Composition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-4 space-y-4"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Aperture className="w-4 h-4 text-primary" />
                Composition
              </h3>

              <div className="space-y-2">
                <Label className="text-xs">Layout</Label>
                <Select value={visualSettings.composition_layout} onValueChange={v => updateSetting('composition_layout', v)}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPOSITION_LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Color & Mood */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-4 space-y-4"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Color & Mood
              </h3>

              <div className="space-y-2">
                <Label className="text-xs">Color Grading Preset</Label>
                <Select value={visualSettings.color_grading_preset} onValueChange={v => updateSetting('color_grading_preset', v)}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_GRADING_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Mood Filter</Label>
                <Select value={visualSettings.mood_filter} onValueChange={v => updateSetting('mood_filter', v)}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOOD_FILTERS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Contrast: {visualSettings.contrast}%</Label>
                <Slider 
                  value={[visualSettings.contrast]} 
                  onValueChange={([v]) => updateSetting('contrast', v)} 
                  min={0} max={100} step={1} 
                  className="slider-gold" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Saturation: {visualSettings.saturation}%</Label>
                <Slider 
                  value={[visualSettings.saturation]} 
                  onValueChange={([v]) => updateSetting('saturation', v)} 
                  min={0} max={100} step={1} 
                  className="slider-gold" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Brightness: {visualSettings.brightness}%</Label>
                <Slider 
                  value={[visualSettings.brightness]} 
                  onValueChange={([v]) => updateSetting('brightness', v)} 
                  min={0} max={100} step={1} 
                  className="slider-gold" 
                />
              </div>
            </motion.div>

            {/* HDR & Exposure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-4 space-y-4"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <SunMedium className="w-4 h-4 text-primary" />
                HDR
              </h3>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label>HDR Enabled</Label>
                  <p className="text-xs text-muted-foreground">High dynamic range output</p>
                </div>
                <Switch 
                  checked={visualSettings.hdr_enabled} 
                  onCheckedChange={v => updateSetting('hdr_enabled', v)} 
                />
              </div>
            </motion.div>

            {/* Export Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-panel p-4 space-y-4"
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Export Settings
              </h3>

              <div className="space-y-2">
                <Label className="text-xs">Aspect Ratio</Label>
                <Select value={visualSettings.aspect_ratio} onValueChange={v => {
                  const dims = getExportDimensions(v);
                  setVisualSettings(prev => ({
                    ...prev,
                    aspect_ratio: v,
                    export_width: dims.width,
                    export_height: dims.height,
                  }));
                }}>
                  <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Export Size</p>
                <p className="font-medium">{exportDims.width} × {exportDims.height} px</p>
              </div>
            </motion.div>

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
                  Re-render with Visual Changes
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

export default VisualControlsPage;
