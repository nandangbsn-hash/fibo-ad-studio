import { motion } from "framer-motion";
import { Camera, Sun, Grid3X3, Palette, Video, Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  FiboConfig, 
  DEFAULT_FIBO_CONFIG,
  SHOT_PRESETS, 
  LIGHTING_TYPES, 
  COMPOSITION_TYPES, 
  BACKGROUND_TYPES,
  DEPTH_OF_FIELD_TYPES,
  CONTRAST_TYPES,
  GRAIN_TYPES,
  AD_FORMATS
} from "@/types/fibo";

interface CameraDirectorProps {
  config: FiboConfig;
  onChange: (config: FiboConfig) => void;
}

const CameraDirector = ({ config, onChange }: CameraDirectorProps) => {
  // Ensure we always have valid config with all required properties
  const safeConfig = config?.input?.camera ? config : DEFAULT_FIBO_CONFIG;
  const { camera, lighting, composition, style, ad_intent } = safeConfig.input;

  const updateCamera = (key: string, value: number | string) => {
    onChange({
      ...safeConfig,
      input: {
        ...safeConfig.input,
        camera: { ...camera, [key]: value }
      }
    });
  };

  const updateLighting = (key: string, value: number | string) => {
    onChange({
      ...safeConfig,
      input: {
        ...safeConfig.input,
        lighting: { ...lighting, [key]: value }
      }
    });
  };

  const updateComposition = (key: string, value: string) => {
    onChange({
      ...safeConfig,
      input: {
        ...safeConfig.input,
        composition: { ...composition, [key]: value }
      }
    });
  };

  const updateStyle = (key: string, value: string | boolean) => {
    onChange({
      ...safeConfig,
      input: {
        ...safeConfig.input,
        style: { ...style, [key]: value }
      }
    });
  };

  const updateAdIntent = (key: string, value: string) => {
    onChange({
      ...safeConfig,
      input: {
        ...safeConfig.input,
        ad_intent: { ...ad_intent, [key]: value }
      }
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
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Camera Angle</Label>
              <span className="text-xs text-primary font-mono">{camera.angle}°</span>
            </div>
            <Slider
              value={[camera.angle]}
              onValueChange={([v]) => updateCamera('angle', v)}
              min={0}
              max={90}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Field of View (FOV)</Label>
              <span className="text-xs text-primary font-mono">{camera.fov}</span>
            </div>
            <Slider
              value={[camera.fov]}
              onValueChange={([v]) => updateCamera('fov', v)}
              min={10}
              max={120}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Distance / Zoom</Label>
              <span className="text-xs text-primary font-mono">{camera.distance.toFixed(1)}</span>
            </div>
            <Slider
              value={[camera.distance * 10]}
              onValueChange={([v]) => updateCamera('distance', v / 10)}
              min={5}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Shot Preset</Label>
            <div className="flex flex-wrap gap-2">
              {SHOT_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={camera.preset === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateCamera('preset', preset.value)}
                  className={camera.preset === preset.value 
                    ? "bg-gradient-gold text-primary-foreground" 
                    : "border-border/50 hover:border-primary/50"}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
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
            <Label className="text-xs text-muted-foreground">Lighting Type</Label>
            <Select 
              value={lighting.type} 
              onValueChange={(v) => updateLighting('type', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIGHTING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Intensity</Label>
              <span className="text-xs text-primary font-mono">{(lighting.intensity * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[lighting.intensity * 100]}
              onValueChange={([v]) => updateLighting('intensity', v / 100)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs text-muted-foreground">Color Temperature</Label>
              <span className="text-xs text-primary font-mono">{lighting.color_temperature}K</span>
            </div>
            <Slider
              value={[lighting.color_temperature]}
              onValueChange={([v]) => updateLighting('color_temperature', v)}
              min={2700}
              max={7500}
              step={100}
            />
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
            <Label className="text-xs text-muted-foreground">Framing</Label>
            <Select 
              value={composition.framing} 
              onValueChange={(v) => updateComposition('framing', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPOSITION_TYPES.map((type) => (
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
              value={composition.background} 
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
            <Label className="text-xs text-muted-foreground">Depth of Field</Label>
            <Select 
              value={composition.depth_of_field} 
              onValueChange={(v) => updateComposition('depth_of_field', v)}
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

      {/* Style Controls */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Palette className="w-4 h-4" />
          Style & Color
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Contrast</Label>
            <Select 
              value={style.contrast} 
              onValueChange={(v) => updateStyle('contrast', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRAST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Film Grain</Label>
            <Select 
              value={style.grain} 
              onValueChange={(v) => updateStyle('grain', v)}
            >
              <SelectTrigger className="bg-muted/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRAIN_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">HDR Mode</Label>
            <Switch
              checked={style.hdr}
              onCheckedChange={(v) => updateStyle('hdr', v)}
            />
          </div>
        </div>
      </div>

      {/* Ad Format */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Settings2 className="w-4 h-4" />
          Ad Format
        </div>

        <Select 
          value={ad_intent.format} 
          onValueChange={(v) => updateAdIntent('format', v)}
        >
          <SelectTrigger className="bg-muted/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AD_FORMATS.map((format) => (
              <SelectItem key={format.value} value={format.value}>
                {format.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.section>
  );
};

export default CameraDirector;
