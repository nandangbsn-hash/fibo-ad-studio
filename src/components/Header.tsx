import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Film, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Ad Director", icon: Sparkles },
    { path: "/feed", label: "Feed", icon: Film },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-t-0 rounded-t-none"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
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
          </Link>
          
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
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
