-- ============= FIBO AD DIRECTOR DATABASE SCHEMA =============

-- Campaigns table: stores brand campaigns
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  product_description TEXT,
  target_audience TEXT,
  mood TEXT,
  color_scheme TEXT,
  category TEXT,
  tone TEXT,
  key_values TEXT[],
  recommended_palette TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ad concepts table: stores individual ad concepts per campaign
CREATE TABLE public.ad_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  structured_prompt JSONB NOT NULL,
  shot_list TEXT[],
  aspect_ratio TEXT DEFAULT '1:1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated images table: stores all generated images with version history
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  concept_id UUID REFERENCES public.ad_concepts(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  seed INTEGER,
  structured_prompt JSONB NOT NULL,
  aspect_ratio TEXT DEFAULT '1:1',
  version INTEGER NOT NULL DEFAULT 1,
  parent_image_id UUID REFERENCES public.generated_images(id) ON DELETE SET NULL,
  -- Camera settings snapshot
  camera_settings JSONB,
  -- Visual settings snapshot  
  visual_settings JSONB,
  -- Metadata
  generation_type TEXT DEFAULT 'initial', -- initial, camera_edit, visual_edit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth for now - can add later)
CREATE POLICY "Public read campaigns" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Public insert campaigns" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update campaigns" ON public.campaigns FOR UPDATE USING (true);
CREATE POLICY "Public delete campaigns" ON public.campaigns FOR DELETE USING (true);

CREATE POLICY "Public read ad_concepts" ON public.ad_concepts FOR SELECT USING (true);
CREATE POLICY "Public insert ad_concepts" ON public.ad_concepts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update ad_concepts" ON public.ad_concepts FOR UPDATE USING (true);
CREATE POLICY "Public delete ad_concepts" ON public.ad_concepts FOR DELETE USING (true);

CREATE POLICY "Public read generated_images" ON public.generated_images FOR SELECT USING (true);
CREATE POLICY "Public insert generated_images" ON public.generated_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update generated_images" ON public.generated_images FOR UPDATE USING (true);
CREATE POLICY "Public delete generated_images" ON public.generated_images FOR DELETE USING (true);

-- Enable realtime for generated_images table
ALTER PUBLICATION supabase_realtime ADD TABLE public.generated_images;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_concepts_updated_at
  BEFORE UPDATE ON public.ad_concepts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_generated_images_campaign ON public.generated_images(campaign_id);
CREATE INDEX idx_generated_images_concept ON public.generated_images(concept_id);
CREATE INDEX idx_generated_images_created ON public.generated_images(created_at DESC);
CREATE INDEX idx_ad_concepts_campaign ON public.ad_concepts(campaign_id);