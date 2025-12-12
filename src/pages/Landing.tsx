import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Sparkles, Film, Wand2, ArrowRight, Zap, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const features = [
    {
      icon: Wand2,
      title: "AI-Powered Generation",
      description: "Transform brand briefs into stunning ad visuals with our FIBO-powered generation engine.",
    },
    {
      icon: Camera,
      title: "Cinematography Controls",
      description: "Fine-tune camera settings, lighting, and composition with professional precision.",
    },
    {
      icon: Palette,
      title: "Visual Director",
      description: "Adjust color grading, mood filters, and tone controls for perfect brand alignment.",
    },
    {
      icon: Film,
      title: "Creative Feed",
      description: "Browse, iterate, and manage your generated ad library with powerful organization tools.",
    },
  ];

  const showcaseItems = [
    { label: "Brands Created", value: "10K+" },
    { label: "Ads Generated", value: "500K+" },
    { label: "Time Saved", value: "95%" },
    { label: "Quality Score", value: "9.5/10" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6">
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

          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-16 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Bria FIBO API v2</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Create Stunning Ads with{" "}
            <span className="text-gradient-gold">AI Precision</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transform your brand vision into production-grade advertising visuals. 
            JSON-native cinematography controls give you complete creative command.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 px-8">
                Start Creating Free
                <Zap className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="px-8">
                <Globe className="w-5 h-5 mr-2" />
                Explore Public Gallery
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto"
        >
          {showcaseItems.map((item, index) => (
            <div key={index} className="glass-panel p-6 text-center">
              <p className="text-3xl font-bold text-gradient-gold mb-1">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Create
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools for generating, refining, and managing your advertising visuals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-6 group hover:border-primary/30 transition-colors"
            >
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-panel p-12 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Ad Creation?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of brands using FIBO Ad Director to create stunning, 
            on-brand advertising visuals in minutes.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 px-10">
              Get Started Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="font-semibold">FIBO Ad Director</span>
            </div>
            <p className="text-sm text-muted-foreground">
              JSON-Native Creative Engine • Powered by Bria FIBO API v2
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
