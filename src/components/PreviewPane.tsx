import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Sparkles, Loader2, Download, ExternalLink, Zap, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiboStructuredPrompt, GeneratedImage } from "@/types/fibo";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PreviewPaneProps {
  structuredPrompt: FiboStructuredPrompt | null;
  aspectRatio: string;
  generatedImages: GeneratedImage[];
  setGeneratedImages: (images: GeneratedImage[]) => void;
  productImageUrl?: string | null;
}

const PreviewPane = ({ structuredPrompt, aspectRatio, generatedImages, setGeneratedImages, productImageUrl }: PreviewPaneProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const hasProductImage = !!productImageUrl;

  const handleGenerate = async () => {
    if (!structuredPrompt) {
      toast({
        title: "No Prompt Available",
        description: "Generate a concept or create a structured prompt first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      let response;
      
      if (hasProductImage) {
        // Use Product Shot API when product image is available
        const sceneDescription = structuredPrompt.short_description || 
          `${structuredPrompt.background_setting}, ${structuredPrompt.lighting?.conditions || 'studio lighting'}`;
        
        const { data, error } = await supabase.functions.invoke('generate-product-shot', {
          body: {
            productImageUrl: productImageUrl,
            sceneDescription: sceneDescription,
            aspectRatio: aspectRatio,
            placementType: 'automatic',
            optimizeDescription: true,
          },
        });

        if (error) throw error;
        response = data;
      } else {
        // Use standard FIBO generation
        const { data, error } = await supabase.functions.invoke('generate-fibo', {
          body: {
            structured_prompt: structuredPrompt,
            aspect_ratio: aspectRatio,
            sync: true,
          },
        });

        if (error) throw error;
        response = data;
      }

      const data = response;
      
      // Handle both response formats
      const imageUrl = data.image_url || data.images?.[0]?.url;
      const seed = data.seed || data.images?.[0]?.seed;
      
      if (data.success && imageUrl) {
        const newImage: GeneratedImage = {
          url: imageUrl,
          id: data.request_id || `gen-${Date.now()}`,
          seed: seed,
          structured_prompt: data.structured_prompt || structuredPrompt
        };
        setGeneratedImages([newImage, ...generatedImages]);
        setSelectedImage(newImage.url);
        toast({
          title: hasProductImage ? "Product Shot Generated!" : "Image Generated!",
          description: seed ? `Seed: ${seed}` : "Ready to use",
        });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Error generating:', error);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate preview",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.section
      id="preview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-panel p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ImageIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Preview</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {hasProductImage ? 'Product Shot generation' : 'Bria FIBO generation'}
              </p>
              {hasProductImage && (
                <Badge variant="secondary" className="text-xs">
                  <Package className="w-3 h-3 mr-1" />
                  Product Mode
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !structuredPrompt}
          className="bg-gradient-gold text-primary-foreground font-semibold glow-gold btn-premium"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {hasProductImage ? 'Generate Product Shot' : 'Generate with FIBO'}
            </>
          )}
        </Button>
      </div>

      {/* Main Preview */}
      <div className="relative aspect-square bg-muted/30 rounded-xl overflow-hidden border border-border/50">
        <AnimatePresence mode="wait">
          {selectedImage ? (
            <motion.img
              key={selectedImage}
              src={selectedImage}
              alt="Generated preview"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground"
            >
              <div className="p-4 bg-muted/50 rounded-2xl">
                <Sparkles className="w-12 h-12" />
              </div>
              <div className="text-center">
                <p className="font-medium">No preview yet</p>
                <p className="text-sm">Generate a concept and click "Generate with FIBO"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isGenerating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
              </div>
              <p className="text-sm text-muted-foreground">Generating with Bria FIBO...</p>
            </div>
          </div>
        )}
      </div>

      {/* Variations Grid */}
      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Generated Images</h3>
          <div className="grid grid-cols-3 gap-3">
            {generatedImages.slice(0, 6).map((img, idx) => (
              <motion.button
                key={img.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedImage(img.url)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === img.url 
                    ? "border-primary glow-gold" 
                    : "border-transparent hover:border-primary/50"
                }`}
              >
                <img
                  src={img.url}
                  alt={`Generation ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedImage === img.url && (
                  <div className="absolute inset-0 bg-primary/10" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {selectedImage && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-border/50"
            onClick={() => window.open(selectedImage, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full Size
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-border/50"
            asChild
          >
            <a href={selectedImage} download>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      )}
    </motion.section>
  );
};

export default PreviewPane;
