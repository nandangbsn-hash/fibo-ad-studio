import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Image, Loader2, ArrowLeft, Play, Download, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SourceImage {
  id: string;
  image_url: string;
  structured_prompt: Record<string, unknown>;
}

const VideoStudioPage = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('idle');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1080p");

  // Fetch source image
  useEffect(() => {
    const fetchImage = async () => {
      if (!imageId) return;
      
      try {
        const { data, error } = await supabase
          .from('generated_images')
          .select('*')
          .eq('id', imageId)
          .single();

        if (error) throw error;
        setSourceImage(data as SourceImage);
      } catch (error) {
        console.error('Error fetching image:', error);
        toast({
          title: "Error",
          description: "Failed to load source image",
          variant: "destructive",
        });
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchImage();
  }, [imageId, toast]);

  // Poll for video status
  const pollVideoStatus = useCallback(async () => {
    if (!generationId) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-video-status', {
        body: {
          generation_id: generationId,
          video_id: videoId,
        },
      });

      if (error) throw error;

      console.log('Video status:', data);

      if (data.status === 'complete' && data.video_url) {
        setVideoUrl(data.video_url);
        setVideoStatus('complete');
        setIsGenerating(false);
        toast({
          title: "Video Ready!",
          description: "Your video ad has been generated successfully.",
        });
      } else if (data.status === 'failed') {
        setVideoStatus('failed');
        setIsGenerating(false);
        toast({
          title: "Generation Failed",
          description: "Video generation failed. Please try again.",
          variant: "destructive",
        });
      } else {
        // Keep polling
        setTimeout(pollVideoStatus, 10000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setTimeout(pollVideoStatus, 10000);
    }
  }, [generationId, videoId, toast]);

  useEffect(() => {
    if (videoStatus === 'generating' && generationId) {
      const timeoutId = setTimeout(pollVideoStatus, 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [videoStatus, generationId, pollVideoStatus]);

  const handleGenerateVideo = async () => {
    if (!sourceImage) return;

    setIsGenerating(true);
    setVideoStatus('generating');
    setVideoUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          source_image_url: sourceImage.image_url,
          source_image_id: sourceImage.id,
          prompt: prompt || 'Subtle camera movement, cinematic product reveal, smooth motion',
          aspect_ratio: aspectRatio,
          resolution: resolution,
        },
      });

      if (error) throw error;

      if (data.success) {
        setGenerationId(data.generation_id);
        setVideoId(data.video_id);
        toast({
          title: "Video Generation Started",
          description: "This may take a few minutes. We'll notify you when it's ready.",
        });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      setIsGenerating(false);
      setVideoStatus('idle');
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to start video generation",
        variant: "destructive",
      });
    }
  };

  if (isLoadingImage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-12">
        {/* Back Button & Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            <span className="text-gradient-gold">Video</span> Studio
          </h1>
          <p className="text-muted-foreground mt-2">
            Transform your ad image into a dynamic 8-second video using Veo 3.1
          </p>
        </motion.div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Source Image & Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Source Image Preview */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Starting Frame</h2>
              </div>
              
              <div className="relative aspect-video bg-muted/30 rounded-xl overflow-hidden border border-border/50">
                {sourceImage ? (
                  <img
                    src={sourceImage.image_url}
                    alt="Source image"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No image loaded
                  </div>
                )}
              </div>
            </div>

            {/* Video Prompt & Settings */}
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Wand2 className="w-5 h-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold">Video Settings</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Video Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the motion and animation... e.g., 'Slow zoom in with subtle particle effects, product rotates gently'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="bg-muted/30 border-border/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="bg-muted/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className="bg-muted/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p</SelectItem>
                        <SelectItem value="1080p">1080p (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleGenerateVideo}
                    disabled={isGenerating || !sourceImage}
                    className="w-full bg-gradient-gold text-primary-foreground font-semibold glow-gold btn-premium"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Generate 8s Video
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Video Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-panel p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Generated Video</h2>
              </div>

              <div className="relative aspect-video bg-muted/30 rounded-xl overflow-hidden border border-border/50">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    {isGenerating ? (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                          <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Generating Video...</p>
                          <p className="text-sm">This may take 2-5 minutes</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-muted/50 rounded-2xl">
                          <Play className="w-12 h-12" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium">No video yet</p>
                          <p className="text-sm">Configure settings and generate</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Video Actions */}
              {videoUrl && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-border/50"
                    onClick={() => window.open(videoUrl, '_blank')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Open Full Size
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-border/50"
                    asChild
                  >
                    <a href={videoUrl} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              )}

              {/* Status Info */}
              {videoStatus !== 'idle' && (
                <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      videoStatus === 'complete' ? 'bg-green-500' :
                      videoStatus === 'failed' ? 'bg-red-500' :
                      'bg-yellow-500 animate-pulse'
                    }`} />
                    <span className="capitalize">{videoStatus}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default VideoStudioPage;
