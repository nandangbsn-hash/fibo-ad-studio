-- Create generated_videos table for video ads
CREATE TABLE public.generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  source_image_id UUID REFERENCES public.generated_images(id) ON DELETE SET NULL,
  video_url TEXT,
  video_prompt TEXT,
  aspect_ratio TEXT DEFAULT '16:9',
  duration INTEGER DEFAULT 8,
  resolution TEXT DEFAULT '1080p',
  status TEXT DEFAULT 'pending',
  generation_id TEXT,
  structured_prompt JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using permissive policies like other tables for consistency)
CREATE POLICY "Public read generated_videos" ON public.generated_videos
  FOR SELECT USING (true);

CREATE POLICY "Public insert generated_videos" ON public.generated_videos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update generated_videos" ON public.generated_videos
  FOR UPDATE USING (true);

CREATE POLICY "Public delete generated_videos" ON public.generated_videos
  FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_generated_videos_updated_at
  BEFORE UPDATE ON public.generated_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();