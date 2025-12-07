import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Target, Palette, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BrandIntake, BrandAnalysis, AdConcept } from "@/types/fibo";

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
      
      if (data.success) {
        onAnalysisComplete(data.brand_analysis, data.concepts);
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
        recommended_palette: "brand_warm_luxury"
      };
      const demoConcepts: AdConcept[] = [
        {
          name: "Hero Spotlight",
          description: "Dramatic product showcase with studio lighting",
          fibo_config: {
            model: "fibo-image-1",
            input: {
              camera: { angle: 35, fov: 28, distance: 1.2, shot: "close_up", preset: "hero_product" },
              lighting: { type: "studio_soft", intensity: 0.85, position: "front_top", color_temperature: 5200 },
              composition: { framing: "rule_of_thirds", background: "minimal_white", depth_of_field: "shallow" },
              style: { color_palette: "brand_warm_luxury", contrast: "medium_high", hdr: true, grain: "none" },
              subject: { type: "physical_product", name: formData.brandName || "Premium Product", brand: formData.brandName, position: "center", context: formData.productDescription || "premium lifestyle advertising" },
              ad_intent: { mood: formData.mood || "sleek, luxurious", target_audience: formData.targetAudience || "urban premium buyers", format: "instagram_1x1", copy_direction: "minimal, clean aesthetic" }
            }
          },
          shot_list: ["Hero wide shot", "Detail macro", "Lifestyle context", "Brand lockup"]
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
