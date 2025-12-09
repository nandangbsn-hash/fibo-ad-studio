import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import BrandIntakeForm from "@/components/BrandIntakeForm";
import CameraDirector from "@/components/CameraDirector";
import JsonPanel from "@/components/JsonPanel";
import PreviewPane from "@/components/PreviewPane";
import ExportCenter from "@/components/ExportCenter";
import ConceptCards from "@/components/ConceptCards";
import { 
  AppConfig, 
  DEFAULT_APP_CONFIG, 
  BrandAnalysis, 
  AdConcept, 
  GeneratedImage,
  FiboStructuredPrompt,
  createDefaultStructuredPrompt
} from "@/types/fibo";

const Index = () => {
  const defaultPrompt = createDefaultStructuredPrompt();

  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [structuredPrompt, setStructuredPrompt] = useState<FiboStructuredPrompt | null>(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (analysis: BrandAnalysis, newConcepts: AdConcept[], productDescription: string) => {
    setBrandAnalysis(analysis);
    setConcepts(newConcepts);
    
    // Update app config with subject description from brand intake
    setAppConfig(prev => ({ ...prev, subject_description: productDescription }));
    
    // Auto-load first concept into editor
    if (newConcepts.length > 0) {
      setStructuredPrompt(newConcepts[0].structured_prompt);
      setAspectRatio(newConcepts[0].aspect_ratio);
    }
  };

  const handleSelectConcept = (prompt: FiboStructuredPrompt, ratio: string) => {
    setStructuredPrompt(prompt);
    setAspectRatio(ratio);
  };

  // When app config changes, build a complete structured prompt with all settings
  const handleConfigChange = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    setAspectRatio(newConfig.aspect_ratio);
    
    // Build complete structured prompt from AppConfig (use buildStructuredPrompt for full mapping)
    const updatedPrompt: FiboStructuredPrompt = {
      short_description: `A ${newConfig.style.artistic_style} ${newConfig.style.medium} of ${newConfig.subject_description || 'Premium product'} for ${brandAnalysis?.category || 'Premium Brand'}. The scene has a ${newConfig.composition.mood} atmosphere with ${newConfig.lighting.conditions} lighting.`,
      objects: structuredPrompt?.objects || [
        {
          description: newConfig.subject_description || 'Premium product',
          location: 'center',
          relative_size: 'large within frame',
          shape_and_color: 'As described by the product',
          texture: 'Realistic, detailed surface',
          appearance_details: `High-quality product photography style, ${newConfig.style.artistic_style}`,
        }
      ],
      background_setting: newConfig.composition.background,
      camera_and_lens: {
        camera_body: 'cinema_arri_red',
        lens_type: 'prime',
        focal_length_mm: parseInt(newConfig.camera.focal_length.match(/\d+/)?.[0] || '85'),
        aperture_f_stop: newConfig.camera.depth_of_field === 'shallow' ? 2.8 : newConfig.camera.depth_of_field === 'medium' ? 5.6 : 11,
        shot_preset: newConfig.camera.shot_type === 'close-up' ? 'closeup' : newConfig.camera.shot_type === 'wide-shot' ? 'wide' : 'medium'
      },
      geometry: {
        tilt_degrees: newConfig.camera.angle === 'high-angle' ? -30 : newConfig.camera.angle === 'low-angle' ? 30 : 0,
        pan_degrees: 0,
        roll_degrees: newConfig.camera.angle === 'dutch-angle' ? 15 : 0,
        distance_meters: 3
      },
      lighting: {
        lighting_type: 'soft_box',
        key_light: { intensity_percent: 100, softness_percent: 50, temperature_kelvin: 5600 },
        fill_light: { intensity_percent: 50 },
        rim_light: { intensity_percent: 70 },
        conditions: newConfig.lighting.conditions,
        direction: newConfig.lighting.direction,
        shadows: newConfig.lighting.intensity === 'soft' ? 'soft, diffused shadows' : 'hard, defined shadows'
      },
      focus_and_motion: {
        focus_distance_meters: 3,
        shutter_angle_degrees: 180,
        shutter_speed: '1/50s',
        depth_of_field: newConfig.camera.depth_of_field,
        focus: 'sharp focus on subject'
      },
      sensor_and_exposure: structuredPrompt?.sensor_and_exposure || {
        iso: 400,
        exposure_compensation_ev: 0,
        white_balance_kelvin: 5600,
        dynamic_range_percent: 80
      },
      visual_and_color: structuredPrompt?.visual_and_color || {
        hdr_enabled: false,
        color_bit_depth: '8-bit',
        color_space: 'sRGB',
        tone_mapping: 'none',
        color_grading: 'none',
        mood_filter: 'none',
        tone_adjustments: { brightness_percent: 50, contrast_percent: 50, saturation_percent: 50, vibrance_percent: 50, clarity_percent: 50 },
        luminance_controls: { highlights_percent: 50, shadows_percent: 50, whites_percent: 50, blacks_percent: 50 }
      },
      aesthetics: {
        composition: `${newConfig.composition.layout} composition`,
        color_scheme: newConfig.style.color_scheme,
        mood_atmosphere: newConfig.composition.mood,
        preference_score: 'very high',
        aesthetic_score: 'very high'
      },
      photographic_characteristics: {
        camera_angle: newConfig.camera.angle
      },
      style_medium: newConfig.style.medium,
      context: `Professional advertising image for ${brandAnalysis?.category || 'Premium Brand'}, targeting premium quality and brand aesthetics.`,
      artistic_style: newConfig.style.artistic_style
    };
    
    setStructuredPrompt(updatedPrompt);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
      </div>

      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-gold">FIBO</span> Ad Director
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate production-grade advertising visuals with JSON-native 
            cinematography controls. Powered by Bria FIBO API v2.
          </p>
        </motion.section>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <BrandIntakeForm 
              onAnalysisComplete={handleAnalysisComplete}
              isLoading={isAnalyzing}
              setIsLoading={setIsAnalyzing}
            />
            
            <ConceptCards 
              concepts={concepts} 
              onSelectConcept={handleSelectConcept} 
            />
            
            <CameraDirector 
              config={appConfig} 
              onChange={handleConfigChange} 
            />
          </div>

          {/* Center Column - Preview */}
          <div className="lg:col-span-4 space-y-6">
            <PreviewPane 
              structuredPrompt={structuredPrompt}
              aspectRatio={aspectRatio}
              generatedImages={generatedImages}
              setGeneratedImages={setGeneratedImages}
            />
            
            <ExportCenter 
              structuredPrompt={structuredPrompt}
              generatedImages={generatedImages}
              brandAnalysis={brandAnalysis}
              concepts={concepts}
            />
          </div>

          {/* Right Column - JSON */}
          <div className="lg:col-span-4">
            <JsonPanel 
              structuredPrompt={structuredPrompt} 
              onChange={setStructuredPrompt} 
            />
          </div>
        </div>

        {/* Brand Analysis Results */}
        {brandAnalysis && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 glass-panel p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Brand Analysis</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <p className="font-medium">{brandAnalysis.category}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Tone</p>
                <p className="font-medium">{brandAnalysis.tone}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Key Values</p>
                <p className="font-medium">{brandAnalysis.key_values.join(", ")}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Palette</p>
                <p className="font-medium">{brandAnalysis.recommended_palette}</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>FIBO Ad Director • JSON-Native Creative Engine • Powered by Bria FIBO API v2</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
