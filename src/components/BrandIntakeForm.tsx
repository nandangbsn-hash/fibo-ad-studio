import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Target, Palette, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BrandIntake, BrandAnalysis, AdConcept, DEFAULT_APP_CONFIG, FiboStructuredPrompt } from "@/types/fibo";

interface BrandIntakeFormProps {
  onAnalysisComplete: (analysis: BrandAnalysis, concepts: AdConcept[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const BrandIntakeForm = ({ onAnalysisComplete, isLoading, setIsLoading }: BrandIntakeFormProps) => {
  const [formData, setFormData] = useState<BrandIntake>({
    brandName: "",
    targetAudience: "",
    mood: "",
    colorScheme: "",
    productDescription: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-brand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success && data.concepts) {
        // Normalize the concepts to ensure proper structure
        const normalizedConcepts: AdConcept[] = data.concepts.map((c: any) => ({
          name: c.name,
          description: c.description,
          structured_prompt: c.structured_prompt,
          shot_list: c.shot_list || [],
          aspect_ratio: c.aspect_ratio || '1:1'
        }));
        onAnalysisComplete(data.brand_analysis, normalizedConcepts);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing brand:', error);
      // Fallback with demo data
      const demoAnalysis: BrandAnalysis = {
        category: "Premium Lifestyle",
        tone: "Sophisticated & Modern",
        key_values: ["Quality", "Innovation", "Elegance"],
        recommended_palette: "Deep blacks, gold accents"
      };
      
      // Create a FIBO-compatible structured prompt for demo
      const demoStructuredPrompt: FiboStructuredPrompt = {
        short_description: `A photorealistic, high-quality product photograph of ${formData.productDescription || 'a premium product'} for ${formData.brandName || 'BRAND'}. The scene has an elegant, luxurious atmosphere with professional studio lighting.`,
        objects: [
          {
            description: formData.productDescription || 'A premium product with sleek design',
            location: 'center',
            relative_size: 'large within frame',
            shape_and_color: 'Elegant design with premium materials',
            texture: 'smooth, premium finish',
            appearance_details: 'High-quality product photography style, photorealistic'
          }
        ],
        background_setting: 'clean, seamless white studio backdrop',
        lighting: {
          conditions: 'bright, even studio lighting',
          direction: 'diffused from multiple sources',
          shadows: 'soft, subtle shadows adding depth'
        },
        aesthetics: {
          composition: 'centered composition',
          color_scheme: formData.colorScheme || 'warm, harmonious',
          mood_atmosphere: formData.mood || 'elegant, luxurious, sophisticated',
          preference_score: 'very high',
          aesthetic_score: 'very high'
        },
        photographic_characteristics: {
          depth_of_field: 'shallow',
          focus: 'sharp focus on subject',
          camera_angle: 'eye-level',
          lens_focal_length: 'portrait (85mm)'
        },
        style_medium: 'photograph',
        context: `Professional advertising image for ${formData.brandName || 'BRAND'}, targeting ${formData.targetAudience || 'premium buyers'}.`,
        artistic_style: 'photorealistic, detailed'
      };
      
      const demoConcepts: AdConcept[] = [
        {
          name: "Hero Spotlight",
          description: "Dramatic product showcase with studio lighting",
          structured_prompt: demoStructuredPrompt,
          shot_list: ["Hero wide shot", "Detail macro", "Lifestyle context", "Brand lockup"],
          aspect_ratio: "1:1"
        }
      ];
      onAnalysisComplete(demoAnalysis, demoConcepts);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoData = () => {
    setFormData({
      brandName: "AURORA",
      targetAudience: "Urban premium buyers, tech enthusiasts, 25-45",
      mood: "Sleek, luxurious, precision-engineered, futuristic",
      colorScheme: "Deep blacks, warm gold accents, subtle silver",
      productDescription: "Premium matte black smartwatch with titanium finish and sapphire crystal display",
    });
  };

  return (
    <motion.section 
      id="brand"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Brand Intake</h2>
            <p className="text-sm text-muted-foreground">Define your brand for AI analysis</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadDemoData}
          className="border-primary/30 hover:bg-primary/10"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Demo Mode
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brandName" className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Brand Name
            </Label>
            <Input
              id="brandName"
              placeholder="e.g., AURORA"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              className="bg-muted/50 border-border/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience" className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Target Audience
            </Label>
            <Input
              id="targetAudience"
              placeholder="e.g., Urban premium buyers, 25-45"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="bg-muted/50 border-border/50"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mood" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Mood / Style
            </Label>
            <Input
              id="mood"
              placeholder="e.g., Sleek, luxurious, futuristic"
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className="bg-muted/50 border-border/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorScheme" className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Color Scheme (Optional)
            </Label>
            <Input
              id="colorScheme"
              placeholder="e.g., Deep blacks, gold accents"
              value={formData.colorScheme}
              onChange={(e) => setFormData({ ...formData, colorScheme: e.target.value })}
              className="bg-muted/50 border-border/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="productDescription">Product Description</Label>
          <Textarea
            id="productDescription"
            placeholder="Describe your product in detail..."
            value={formData.productDescription}
            onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
            className="bg-muted/50 border-border/50 min-h-[100px]"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-gold text-primary-foreground font-semibold glow-gold btn-premium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Brand...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Ad Concepts
            </>
          )}
        </Button>
      </form>
    </motion.section>
  );
};

export default BrandIntakeForm;
