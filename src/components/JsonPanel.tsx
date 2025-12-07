import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiboConfig, DEFAULT_FIBO_CONFIG } from "@/types/fibo";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import { normalizeFiboConfig } from "@/utils/fiboHelpers";

interface JsonPanelProps {
  config: FiboConfig;
  onChange: (config: FiboConfig) => void;
}

const JsonPanel = ({ config, onChange }: JsonPanelProps) => {
  const [jsonString, setJsonString] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Ensure we always display valid config
  const safeConfig = config?.input?.camera ? config : DEFAULT_FIBO_CONFIG;

  useEffect(() => {
    setJsonString(JSON.stringify(safeConfig, null, 2));
    setError(null);
  }, [safeConfig]);

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setJsonString(value);
    
    try {
      const parsed = JSON.parse(value);
      // Normalize the parsed config to ensure proper structure
      const normalized = normalizeFiboConfig(parsed);
      onChange(normalized);
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
      description: "FIBO JSON copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    onChange(DEFAULT_FIBO_CONFIG);
    toast({
      title: "Reset",
      description: "Configuration reset to defaults",
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
            <h2 className="text-lg font-semibold">FIBO JSON</h2>
            <p className="text-sm text-muted-foreground">Live configuration</p>
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
        <span>Changes sync automatically with Camera Director</span>
      </div>
    </motion.section>
  );
};

export default JsonPanel;
