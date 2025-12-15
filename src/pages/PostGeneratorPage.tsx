import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, RefreshCw, Check, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const platforms = [
  { value: 'instagram', label: 'Instagram', limit: 2200 },
  { value: 'twitter', label: 'Twitter/X', limit: 280 },
  { value: 'linkedin', label: 'LinkedIn', limit: 3000 },
  { value: 'facebook', label: 'Facebook', limit: 63206 },
  { value: 'tiktok', label: 'TikTok', limit: 2200 },
];

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'playful', label: 'Playful' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'bold', label: 'Bold' },
  { value: 'friendly', label: 'Friendly' },
];

export default function PostGeneratorPage() {
  const { imageId } = useParams();
  const navigate = useNavigate();
  
  const [imageData, setImageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("casual");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  
  // Generated content
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [alternativeVersions, setAlternativeVersions] = useState<string[]>([]);
  const [suggestedBestTime, setSuggestedBestTime] = useState<string | null>(null);
  const [engagementTips, setEngagementTips] = useState<string[]>([]);

  useEffect(() => {
    if (imageId) {
      fetchImageData();
    }
  }, [imageId]);

  const fetchImageData = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*, campaigns(*)')
        .eq('id', imageId)
        .single();

      if (error) throw error;
      setImageData(data);
    } catch (error) {
      console.error('Error fetching image:', error);
      toast.error('Failed to load image');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!imageData?.image_url) {
      toast.error('No image available');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: {
          imageUrl: imageData.image_url,
          prompt,
          platform,
          tone,
          includeHashtags,
          includeEmojis,
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setGeneratedPost(data.post);
      setAlternativeVersions(data.alternativeVersions || []);
      setSuggestedBestTime(data.suggestedBestTime);
      setEngagementTips(data.engagementTips || []);
      
      toast.success('Post generated successfully!');
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error('Failed to generate post');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPlatform = platforms.find(p => p.value === platform);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Post Generator</h1>
          </div>
          {imageData?.campaigns?.brand_name && (
            <Badge variant="secondary">{imageData.campaigns.brand_name}</Badge>
          )}
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Settings */}
          <div className="space-y-6">
            {/* Image Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Source Image</CardTitle>
              </CardHeader>
              <CardContent>
                {imageData?.image_url && (
                  <img 
                    src={imageData.image_url} 
                    alt="Product" 
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                )}
              </CardContent>
            </Card>

            {/* Post Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">What kind of post do you want?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Create a fun summer vibes post for our new product launch..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label} ({p.limit} chars)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="hashtags">Include Hashtags</Label>
                  <Switch
                    id="hashtags"
                    checked={includeHashtags}
                    onCheckedChange={setIncludeHashtags}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="emojis">Include Emojis</Label>
                  <Switch
                    id="emojis"
                    checked={includeEmojis}
                    onCheckedChange={setIncludeEmojis}
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  className="w-full" 
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Post
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Generated Content */}
          <div className="space-y-6">
            {/* Main Post */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Generated Post</CardTitle>
                  {generatedPost && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {generatedPost.length}/{selectedPlatform?.limit}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(generatedPost)}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedPost ? (
                  <div className="rounded-lg bg-muted/50 p-4 whitespace-pre-wrap">
                    {generatedPost}
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/30 p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Your generated post will appear here</p>
                    <p className="text-sm mt-1">Configure settings and click Generate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alternative Versions */}
            {alternativeVersions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Alternative Versions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alternativeVersions.map((version, index) => (
                    <div key={index} className="rounded-lg bg-muted/30 p-3 relative group">
                      <p className="text-sm whitespace-pre-wrap pr-8">{version}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(version)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            {(suggestedBestTime || engagementTips.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Tips for Success</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestedBestTime && (
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="shrink-0">Best Time</Badge>
                      <p className="text-sm text-muted-foreground">{suggestedBestTime}</p>
                    </div>
                  )}
                  {engagementTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0">Tip {index + 1}</Badge>
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
