import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ImageIcon, Camera, Palette, Clock, Sparkles, Loader2, Globe, Lock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useFeed } from "@/hooks/useFeed";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Feed = () => {
  const { feedItems, isLoading, refetch } = useFeed();
  const navigate = useNavigate();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleOpenCameraDirector = (imageId: string) => {
    navigate(`/camera-director/${imageId}`);
  };

  const handleOpenVisualControls = (imageId: string) => {
    navigate(`/visual-controls/${imageId}`);
  };

  const handleTogglePublic = async (imageId: string, currentlyPublic: boolean) => {
    setTogglingId(imageId);
    try {
      const { error } = await supabase
        .from("generated_images")
        .update({ is_public: !currentlyPublic } as never)
        .eq("id", imageId);

      if (error) throw error;

      toast.success(currentlyPublic ? "Removed from Explore" : "Published to Explore!");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update visibility");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-gold">Ad Director</span> Feed
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse all generated ad concepts and campaigns. Select any image to refine it in Camera Director or Visual Controls.
          </p>
        </motion.section>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && feedItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="p-4 bg-muted/30 rounded-2xl inline-block mb-4">
              <Sparkles className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No ads generated yet</h3>
            <p className="text-muted-foreground mb-6">
              Head to the Ad Director to create your first campaign.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-gold text-primary-foreground font-semibold"
            >
              Create First Ad
            </Button>
          </motion.div>
        )}

        {/* Feed Grid */}
        {!isLoading && feedItems.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {feedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-panel overflow-hidden group"
              >
                {/* Image Preview */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.concept?.name || 'Generated ad'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Version Badge */}
                  {item.version > 1 && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium">
                      v{item.version}
                    </div>
                  )}

                  {/* Generation Type Badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-primary/80 backdrop-blur-sm rounded-full text-xs font-medium text-primary-foreground">
                    {item.generation_type === 'initial' ? 'Original' : 
                     item.generation_type === 'camera_edit' ? 'Camera Edit' : 'Visual Edit'}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenCameraDirector(item.id)}
                        className="bg-accent text-accent-foreground"
                      >
                        <Camera className="w-4 h-4 mr-1" />
                        Camera
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenVisualControls(item.id)}
                        variant="outline"
                        className="border-border"
                      >
                        <Palette className="w-4 h-4 mr-1" />
                        Visuals
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/video-studio/${item.id}`)}
                      className="bg-primary text-primary-foreground"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Convert to Video
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">
                        {item.campaign?.brand_name || 'Untitled'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.concept?.name || item.structured_prompt.short_description?.slice(0, 50)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-1 bg-muted/50 rounded">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.created_at), 'MMM d, h:mm a')}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-7 px-2 ${item.is_public ? 'text-primary' : 'text-muted-foreground'}`}
                      onClick={() => handleTogglePublic(item.id, item.is_public || false)}
                      disabled={togglingId === item.id}
                    >
                      {togglingId === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : item.is_public ? (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Private
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
