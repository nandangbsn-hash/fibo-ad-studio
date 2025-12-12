import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, ArrowRight, Loader2, Globe, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PublicImage {
  id: string;
  image_url: string;
  aspect_ratio: string;
  version: number;
  generation_type: string;
  created_at: string;
  campaign_id: string | null;
  concept_id: string | null;
}

const Explore = () => {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicImages = async () => {
      try {
        const query = supabase.from("generated_images").select("*");
        const filtered = query.eq("is_public" as never, true as never);
        const ordered = filtered.order("created_at" as never, { ascending: false } as never);
        const limited = ordered.limit(50);
        const result = await limited;

        if (result.data) {
          setImages(result.data as unknown as PublicImage[]);
        }
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };

    fetchPublicImages();
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6">
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

      {/* Header */}
      <section className="relative z-10 container mx-auto px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Public Gallery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore <span className="text-gradient-gold">Community Creations</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover stunning ad visuals created by the FIBO community. Get inspired and start creating your own.
          </p>
        </motion.div>
      </section>

      {/* Gallery */}
      <section className="relative z-10 container mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <Eye className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Public Ads Yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share your creations with the community!
            </p>
            <Link to="/auth">
              <Button className="bg-gradient-gold text-primary-foreground">
                Create Your First Ad
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel overflow-hidden group"
              >
                <div className="relative aspect-square">
                  <img
                    src={image.image_url}
                    alt="Generated ad"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                        v{image.version}
                      </span>
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                        {image.aspect_ratio}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">Creative Ad</h3>
                  <p className="text-sm text-muted-foreground truncate">AI Generated</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="relative z-10 container mx-auto px-6 py-16">
        <div className="glass-panel p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Want to Create Your Own?</h2>
          <p className="text-muted-foreground mb-6">
            Sign up for free and start generating stunning ad visuals with FIBO Ad Director.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-gold text-primary-foreground">
              Start Creating Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
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

export default Explore;
