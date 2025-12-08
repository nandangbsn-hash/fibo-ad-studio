import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import BrandIntakeForm from "@/components/BrandIntakeForm";
import ConceptCards from "@/components/ConceptCards";
import JsonPanel from "@/components/JsonPanel";
import PreviewPane from "@/components/PreviewPane";
import { useImageStore } from "@/hooks/useImageStore";
import { useToast } from "@/hooks/use-toast";
import { 
  AppConfig, 
  DEFAULT_APP_CONFIG, 
  BrandAnalysis, 
  AdConcept, 
  GeneratedImage,
  FiboStructuredPrompt,
  createDefaultStructuredPrompt
} from "@/types/fibo";
import { DEFAULT_CAMERA_SETTINGS, DEFAULT_VISUAL_SETTINGS } from "@/types/database";

const AdDirector = () => {
  const navigate = useNavigate();
  const { saveCampaign, saveConcept, saveGeneratedImage } = useImageStore();
  const { toast } = useToast();

  const defaultPrompt = createDefaultStructuredPrompt();

  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [structuredPrompt, setStructuredPrompt] = useState<FiboStructuredPrompt | null>(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [concepts, setConcepts] = useState<AdConcept[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);

  const handleAnalysisComplete = async (
    analysis: BrandAnalysis, 
    newConcepts: AdConcept[], 
    productDescription: string
  ) => {
    setBrandAnalysis(analysis);
    setConcepts(newConcepts);
    
    // Update app config with subject description from brand intake
    setAppConfig(prev => ({ ...prev, subject_description: productDescription }));
    
    // Save campaign to database
    const campaign = await saveCampaign({
      brand_name: productDescription.split(' ').slice(0, 3).join(' ') || 'New Campaign',
      product_description: productDescription,
      category: analysis.category,
      tone: analysis.tone,
      key_values: analysis.key_values,
      recommended_palette: analysis.recommended_palette,
    });

    if (campaign) {
      setCurrentCampaignId(campaign.id);
      
      // Save concepts to database
      for (const concept of newConcepts) {
        await saveConcept(
          campaign.id,
          concept.name,
          concept.description,
          concept.structured_prompt,
          concept.shot_list,
          concept.aspect_ratio
        );
      }

      toast({ title: "Campaign created!", description: "Your brand campaign has been saved." });
    }
    
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

  // Handle image generation - saves to database
  const handleImagesGenerated = async (newImages: GeneratedImage[]) => {
    setGeneratedImages(newImages);
    
    // Save each new image to database
    for (const img of newImages) {
      if (!generatedImages.find(existing => existing.id === img.id)) {
        await saveGeneratedImage(
          img.url,
          structuredPrompt!,
          aspectRatio,
          img.seed,
          currentCampaignId || undefined,
          undefined,
          DEFAULT_CAMERA_SETTINGS,
          DEFAULT_VISUAL_SETTINGS,
          'initial'
        );
      }
    }
  };

  // When app config changes, rebuild the structured prompt
  const handleConfigChange = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    setAspectRatio(newConfig.aspect_ratio);
    
    const subject = newConfig.subject_description || 
                    brandAnalysis?.category || 
                    'Premium product';
    const brand = brandAnalysis?.category || 'Premium Brand';
    
    const updatedPrompt = buildStructuredPrompt(newConfig, subject, brand);
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
            <span className="text-gradient-gold">Ad</span> Director
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Brand input & concept generation. Create campaigns, then refine in Camera Director or Visual Controls.
          </p>
        </motion.section>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Brand Input */}
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
          </div>

          {/* Center Column - Preview */}
          <div className="lg:col-span-4 space-y-6">
            <PreviewPane 
              structuredPrompt={structuredPrompt}
              aspectRatio={aspectRatio}
              generatedImages={generatedImages}
              setGeneratedImages={handleImagesGenerated}
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

export default AdDirector;
