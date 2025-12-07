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
  buildStructuredPrompt
} from "@/types/fibo";

const Index = () => {
  // Initialize with a default structured prompt so users can generate immediately
  const defaultPrompt: FiboStructuredPrompt = {
    short_description: "A photorealistic product photograph of a premium item on a clean background.",
    objects: [
      {
        description: "A premium product with sleek design",
        location: "center",
        relative_size: "large within frame",
        shape_and_color: "Elegant design with premium materials",
        texture: "smooth, premium finish",
        appearance_details: "High-quality product photography style"
      }
    ],
    background_setting: "clean, seamless white studio backdrop",
    lighting: {
      conditions: "bright, even studio lighting",
      direction: "diffused from multiple sources",
      shadows: "soft, subtle shadows adding depth"
    },
    aesthetics: {
      composition: "centered composition",
      color_scheme: "neutral, elegant",
      mood_atmosphere: "professional, clean",
      preference_score: "high",
      aesthetic_score: "high"
    },
    photographic_characteristics: {
      depth_of_field: "shallow",
      focus: "sharp focus on subject",
      camera_angle: "eye-level",
      lens_focal_length: "portrait (85mm)"
    },
    style_medium: "photograph",
    context: "Professional product photography for advertising.",
    artistic_style: "photorealistic, commercial"
  };

  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [structuredPrompt, setStructuredPrompt] = useState<FiboStructuredPrompt | null>(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (analysis: BrandAnalysis, newConcepts: AdConcept[]) => {
    setBrandAnalysis(analysis);
    setConcepts(newConcepts);
    
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

  // When app config changes, rebuild the structured prompt
  const handleConfigChange = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    setAspectRatio(newConfig.aspect_ratio);
    
    // Rebuild structured prompt based on new config
    if (structuredPrompt) {
      const updatedPrompt = buildStructuredPrompt(
        newConfig, 
        appConfig.subject_description || 'Premium product',
        brandAnalysis?.category || 'Premium Brand'
      );
      setStructuredPrompt(updatedPrompt);
    }
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
