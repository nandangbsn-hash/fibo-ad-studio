import { motion } from "framer-motion";
import { Camera, Sun, Grid3X3, Palette, Video, Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AppConfig, 
  DEFAULT_APP_CONFIG,
  SHOT_TYPES, 
  FOCAL_LENGTHS,
  DEPTH_OF_FIELD_TYPES,
  LIGHTING_CONDITIONS,
  LIGHTING_DIRECTIONS,
  COMPOSITION_LAYOUTS,
  BACKGROUND_TYPES,
  MOOD_ATMOSPHERES,
  STYLE_MEDIUMS,
  ARTISTIC_STYLES,
  ASPECT_RATIOS
} from "@/types/fibo";

interface CameraDirectorProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}

const CameraDirector = ({ config, onChange }: CameraDirectorProps) => {
  // Ensure we always have valid config with all required properties
  const safeConfig = config?.camera ? config : DEFAULT_APP_CONFIG;

  const updateCamera = (key: string, value: string) => {
    onChange({
      ...safeConfig,
      camera: { ...safeConfig.camera, [key]: value }
    });
  };

  const updateLighting = (key: string, value: string) => {
    onChange({
      ...safeConfig,
      lighting: { ...safeConfig.lighting, [key]: value }
    });
  };

  const updateComposition = (key: string, value: string) => {
    onChange({
      ...safeConfig,
      composition: { ...safeConfig.composition, [key]: value }
    });
  };

  const updateStyle = (key: string, value: string) => {
    onChange({
      ...safeConfig,
      style: { ...safeConfig.style, [key]: value }
    });
  };

  return (
    <motion.section
      id="director"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Camera Director</h2>
          <p className="text-sm text-muted-foreground">Fine-tune cinematography parameters</p>
        </div>
      </div>

      {/* Camera Controls */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Camera className="w-4 h-4" />
          Camera Controls
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Camera Angle</Label>
            <Select 
              value={safeConfig.camera.angle} 
              onValueChange={(v) => updateCamera('angle', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Lens / Focal Length</Label>
            <Select 
              value={safeConfig.camera.focal_length} 
              onValueChange={(v) => updateCamera('focal_length', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOCAL_LENGTHS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Depth of Field</Label>
            <Select 
              value={safeConfig.camera.depth_of_field} 
              onValueChange={(v) => updateCamera('depth_of_field', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPTH_OF_FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lighting Controls */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sun className="w-4 h-4" />
          Lighting Controls
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Lighting Conditions</Label>
            <Select 
              value={safeConfig.lighting.conditions} 
              onValueChange={(v) => updateLighting('conditions', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIGHTING_CONDITIONS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Light Direction</Label>
            <Select 
              value={safeConfig.lighting.direction} 
              onValueChange={(v) => updateLighting('direction', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIGHTING_DIRECTIONS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Composition Controls */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Grid3X3 className="w-4 h-4" />
          Composition
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Layout</Label>
            <Select 
              value={safeConfig.composition.layout} 
              onValueChange={(v) => updateComposition('layout', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPOSITION_LAYOUTS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Background</Label>
            <Select 
              value={safeConfig.composition.background} 
              onValueChange={(v) => updateComposition('background', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKGROUND_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mood & Atmosphere</Label>
            <Select 
              value={safeConfig.composition.mood} 
              onValueChange={(v) => updateComposition('mood', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOOD_ATMOSPHERES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Style Controls */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Palette className="w-4 h-4" />
          Style & Medium
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Medium</Label>
            <Select 
              value={safeConfig.style.medium} 
              onValueChange={(v) => updateStyle('medium', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_MEDIUMS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Artistic Style</Label>
            <Select 
              value={safeConfig.style.artistic_style} 
              onValueChange={(v) => updateStyle('artistic_style', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARTISTIC_STYLES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Settings2 className="w-4 h-4" />
          Aspect Ratio
        </div>

        <Select 
          value={safeConfig.aspect_ratio} 
          onValueChange={(v) => onChange({ ...safeConfig, aspect_ratio: v })}
        >
          <SelectTrigger className="bg-muted/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map((ratio) => (
              <SelectItem key={ratio.value} value={ratio.value}>
                {ratio.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.section>
  );
};

export default CameraDirector;
