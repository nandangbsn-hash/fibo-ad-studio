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
