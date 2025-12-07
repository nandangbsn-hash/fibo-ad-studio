import { motion } from "framer-motion";
import { Lightbulb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdConcept, FiboConfig } from "@/types/fibo";
import { normalizeFiboConfig } from "@/utils/fiboHelpers";

interface ConceptCardsProps {
  concepts: AdConcept[];
  onSelectConcept: (config: FiboConfig) => void;
}

const ConceptCards = ({ concepts, onSelectConcept }: ConceptCardsProps) => {
  if (concepts.length === 0) return null;

  const handleSelectConcept = (rawConfig: any) => {
    // Ensure the config is properly normalized before passing to parent
    const normalized = normalizeFiboConfig(rawConfig);
    onSelectConcept(normalized);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Generated Concepts</h2>
          <p className="text-sm text-muted-foreground">Click to load into Camera Director</p>
        </div>
      </div>

      <div className="grid gap-3">
        {concepts.map((concept, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => handleSelectConcept(concept.fibo_config)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {concept.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {concept.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {concept.shot_list.slice(0, 3).map((shot, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                    >
                      {shot}
                    </span>
                  ))}
                  {concept.shot_list.length > 3 && (
                    <span className="text-xs px-2 py-0.5 text-muted-foreground">
                      +{concept.shot_list.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default ConceptCards;
