import { motion } from "framer-motion";
import { Package, FileJson, Image, FileArchive, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiboConfig, GeneratedImage, BrandAnalysis, AdConcept } from "@/types/fibo";
import { useToast } from "@/hooks/use-toast";

interface ExportCenterProps {
  config: FiboConfig;
  generatedImages: GeneratedImage[];
  brandAnalysis: BrandAnalysis | null;
  concepts: AdConcept[];
}

const ExportCenter = ({ config, generatedImages, brandAnalysis, concepts }: ExportCenterProps) => {
  const { toast } = useToast();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fibo-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON Exported",
      description: "FIBO configuration saved",
    });
  };

  const exportShotList = () => {
    const shotList = concepts.flatMap(c => 
      c.shot_list.map((shot, i) => `${c.name} - Shot ${i + 1}: ${shot}`)
    ).join('\n');
    
    const content = `# FIBO Ad Director - Shot List
# Brand: ${config.input.subject.brand}
# Generated: ${new Date().toISOString()}

${shotList || 'No shot list available. Generate concepts first.'}

## Camera Settings
- Angle: ${config.input.camera.angle}°
- FOV: ${config.input.camera.fov}
- Distance: ${config.input.camera.distance}
- Preset: ${config.input.camera.preset}

## Lighting
- Type: ${config.input.lighting.type}
- Intensity: ${(config.input.lighting.intensity * 100).toFixed(0)}%
- Color Temperature: ${config.input.lighting.color_temperature}K

## Composition
- Framing: ${config.input.composition.framing}
- Background: ${config.input.composition.background}
- Depth of Field: ${config.input.composition.depth_of_field}
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
      brand_name: config.input.subject.brand,
      analysis: brandAnalysis,
      fibo_config: config,
      concepts: concepts,
      generated_at: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-pack-${config.input.subject.brand}-${Date.now()}.json`;
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
      description: "Export current configuration",
      action: exportJson,
      available: true,
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
        generatedImages.forEach((img, i) => {
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
      available: true,
    },
    {
      icon: Package,
      title: "Brand Assets Pack",
      description: "Complete brand export",
      action: exportBrandPack,
      available: true,
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
          <p className="text-2xl font-bold text-gradient-gold">1</p>
          <p className="text-xs text-muted-foreground">Config</p>
        </div>
      </div>
    </motion.section>
  );
};

export default ExportCenter;
