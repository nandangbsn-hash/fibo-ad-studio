import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiboStructuredPrompt } from "@/types/fibo";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";

interface JsonPanelProps {
  structuredPrompt: FiboStructuredPrompt | null;
  onChange: (structuredPrompt: FiboStructuredPrompt) => void;
}

const DEFAULT_PROMPT: FiboStructuredPrompt = {
  short_description: "A photorealistic product photograph with cinematic lighting.",
  objects: [
    {
      description: "Subject as described",
      location: "center",
      relative_size: "large within frame",
      shape_and_color: "As specified in prompt",
      texture: "realistic, detailed surface",
      appearance_details: "High-quality photography style"
    }
  ],
  background_setting: "clean studio backdrop",
  camera_and_lens: {
    camera_body: "cinema_arri_red",
    lens_type: "prime",
    focal_length_mm: 85,
    aperture_f_stop: 2.8,
    shot_preset: "medium"
  },
  geometry: {
    tilt_degrees: 0,
    pan_degrees: 0,
    roll_degrees: 0,
    distance_meters: 3
  },
  lighting: {
    lighting_type: "soft_box",
    key_light: { intensity_percent: 100, softness_percent: 50, temperature_kelvin: 5600 },
    fill_light: { intensity_percent: 50 },
    rim_light: { intensity_percent: 70 },
    conditions: "studio lighting",
    direction: "diffused from multiple sources",
    shadows: "soft shadows"
  },
  focus_and_motion: {
    focus_distance_meters: 3,
    shutter_angle_degrees: 180,
    shutter_speed: "1/50s",
    depth_of_field: "shallow",
    focus: "sharp focus on subject"
  },
  sensor_and_exposure: {
    iso: 400,
    exposure_compensation_ev: 0,
    white_balance_kelvin: 5600,
    dynamic_range_percent: 80
  },
  visual_and_color: {
    hdr_enabled: false,
    color_bit_depth: "8-bit",
    color_space: "sRGB",
    tone_mapping: "none",
    color_grading: "none",
    mood_filter: "none",
    color_palette: [
      { hue: 30, saturation: 80, hex: "#cc8033", label: "Primary" },
      { hue: 180, saturation: 60, hex: "#33cccc", label: "Secondary" },
      { hue: 300, saturation: 70, hex: "#cc33cc", label: "Accent" }
    ],
    tone_adjustments: {
      brightness_percent: 50,
      contrast_percent: 50,
      saturation_percent: 50,
      vibrance_percent: 50,
      clarity_percent: 50
    },
    luminance_controls: {
      highlights_percent: 50,
      shadows_percent: 50,
      whites_percent: 50,
      blacks_percent: 50
    }
  },
  aesthetics: {
    composition: "centered composition",
    color_scheme: "neutral",
    mood_atmosphere: "professional",
    preference_score: "high",
    aesthetic_score: "high"
  },
  photographic_characteristics: {
    camera_angle: "eye-level"
  },
  style_medium: "photograph",
  context: "Professional photography.",
  artistic_style: "photorealistic"
};

const JsonPanel = ({ structuredPrompt, onChange }: JsonPanelProps) => {
  const currentPrompt = structuredPrompt || DEFAULT_PROMPT;
  const [jsonString, setJsonString] = useState(JSON.stringify(currentPrompt, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setJsonString(JSON.stringify(currentPrompt, null, 2));
    setError(null);
  }, [structuredPrompt]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setJsonString(value);
    
    try {
      const parsed = JSON.parse(value) as FiboStructuredPrompt;
      onChange(parsed);
      setError(null);
    } catch (e) {
      setError("Invalid JSON syntax");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "FIBO structured prompt copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setJsonString(JSON.stringify(currentPrompt, null, 2));
    setError(null);
    toast({
      title: "Reset",
      description: "JSON reset to current structured prompt",
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-panel p-6 space-y-4 h-full flex flex-col"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">FIBO Structured Prompt</h2>
            <p className="text-sm text-muted-foreground">Live configuration for Bria API</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="border-border/50"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            className="border-border/50"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-[400px] rounded-lg overflow-hidden border border-border/50">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={jsonString}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            roundedSelection: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            formatOnPaste: true,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Edit the JSON directly to customize your generation</span>
      </div>
    </motion.section>
  );
};

export default JsonPanel;
