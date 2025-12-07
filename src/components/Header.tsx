import { Camera, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-t-0 rounded-t-none"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
              <div className="relative p-2 bg-gradient-gold rounded-xl">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-gold">FIBO Ad Director</h1>
              <p className="text-xs text-muted-foreground">JSON-Native Creative Engine</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#brand" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Brand Intake
            </a>
            <a href="#director" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Camera Director
            </a>
            <a href="#preview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Preview
            </a>
            <a href="#export" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Export
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">FIBO Powered</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
