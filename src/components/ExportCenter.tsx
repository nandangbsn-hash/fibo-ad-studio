import { motion } from "framer-motion";
import { Package, FileJson, Image, FileArchive, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiboStructuredPrompt, GeneratedImage, BrandAnalysis, AdConcept } from "@/types/fibo";
import { useToast } from "@/hooks/use-toast";

interface ExportCenterProps {
  structuredPrompt: FiboStructuredPrompt | null;
  generatedImages: GeneratedImage[];
  brandAnalysis: BrandAnalysis | null;
  concepts: AdConcept[];
}

const ExportCenter = ({ structuredPrompt, generatedImages, brandAnalysis, concepts }: ExportCenterProps) => {
  const { toast } = useToast();

  const exportJson = () => {
    if (!structuredPrompt) {
      toast({
        title: "No Data",
        description: "Generate a concept first",
        variant: "destructive",
      });
      return;
    }
    
    const blob = new Blob([JSON.stringify(structuredPrompt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fibo-structured-prompt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON Exported",
      description: "FIBO structured prompt saved",
    });
  };

  const exportShotList = () => {
    const shotList = concepts.flatMap(c => 
      c.shot_list.map((shot, i) => `${c.name} - Shot ${i + 1}: ${shot}`)
    ).join('\n');
    
    const content = `# FIBO Ad Director - Shot List
# Generated: ${new Date().toISOString()}

${shotList || 'No shot list available. Generate concepts first.'}

## Structured Prompt Summary
${structuredPrompt?.short_description || 'No description available'}

## Style
- Medium: ${structuredPrompt?.style_medium || 'N/A'}
- Artistic Style: ${structuredPrompt?.artistic_style || 'N/A'}

## Lighting
- Conditions: ${structuredPrompt?.lighting?.conditions || 'N/A'}
- Direction: ${structuredPrompt?.lighting?.direction || 'N/A'}

## Composition
- ${structuredPrompt?.aesthetics?.composition || 'N/A'}
- Mood: ${structuredPrompt?.aesthetics?.mood_atmosphere || 'N/A'}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shot-list-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Shot List Exported",
      description: "Cinematography guide saved",
    });
  };

  const exportBrandPack = () => {
    const pack = {
      analysis: brandAnalysis,
      structured_prompt: structuredPrompt,
      concepts: concepts,
      generated_at: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-pack-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Brand Pack Exported",
      description: "Complete brand assets saved",
    });
  };

  const exportOptions = [
    {
      icon: FileJson,
      title: "FIBO JSON",
      description: "Export structured prompt",
      action: exportJson,
      available: !!structuredPrompt,
    },
    {
      icon: Image,
      title: "Generated Images",
      description: `${generatedImages.length} images available`,
      action: () => {
        if (generatedImages.length === 0) {
          toast({
            title: "No Images",
            description: "Generate images first",
            variant: "destructive",
          });
          return;
        }
        generatedImages.forEach((img) => {
          window.open(img.url, '_blank');
        });
      },
      available: generatedImages.length > 0,
    },
    {
      icon: FileText,
      title: "Shot List",
      description: "Cinematography guide",
      action: exportShotList,
      available: concepts.length > 0,
    },
    {
      icon: Package,
      title: "Brand Assets Pack",
      description: "Complete brand export",
      action: exportBrandPack,
      available: !!brandAnalysis,
    },
  ];

  return (
    <motion.section
      id="export"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-panel p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileArchive className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Export Center</h2>
          <p className="text-sm text-muted-foreground">Download your assets</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exportOptions.map((option, idx) => (
          <motion.div
            key={option.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.05 }}
          >
            <Button
              variant="outline"
              onClick={option.action}
              className={`w-full h-auto flex-col items-start gap-2 p-4 border-border/50 hover:border-primary/50 hover:bg-primary/5 ${
                !option.available ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <option.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{option.title}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {option.description}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
        <div className="text-center">
          <p className="text-2xl font-bold text-gradient-gold">{generatedImages.length}</p>
          <p className="text-xs text-muted-foreground">Images</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gradient-gold">{concepts.length}</p>
          <p className="text-xs text-muted-foreground">Concepts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gradient-gold">{structuredPrompt ? 1 : 0}</p>
          <p className="text-xs text-muted-foreground">Prompts</p>
        </div>
      </div>
    </motion.section>
  );
};

export default ExportCenter;
