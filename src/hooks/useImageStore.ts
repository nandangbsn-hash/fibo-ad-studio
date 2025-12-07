import { supabase } from "@/integrations/supabase/client";
import { FiboStructuredPrompt } from "@/types/fibo";
import { CameraSettings, VisualSettings, Campaign, DbAdConcept, GeneratedImageDb } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export function useImageStore() {
  const { toast } = useToast();

  const saveCampaign = async (data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const insertData = {
        brand_name: data.brand_name || 'Untitled Campaign',
        product_description: data.product_description ?? null,
        target_audience: data.target_audience ?? null,
        mood: data.mood ?? null,
        color_scheme: data.color_scheme ?? null,
        category: data.category ?? null,
        tone: data.tone ?? null,
        key_values: data.key_values ?? null,
        recommended_palette: data.recommended_palette ?? null,
      };

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return campaign;
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({ title: "Error saving campaign", variant: "destructive" });
      return null;
    }
  };

  const saveConcept = async (
    campaignId: string,
    name: string,
    description: string,
    structuredPrompt: FiboStructuredPrompt,
    shotList: string[],
    aspectRatio: string
  ): Promise<DbAdConcept | null> => {
    try {
      const insertData = {
        campaign_id: campaignId,
        name,
        description,
        structured_prompt: structuredPrompt as unknown as Json,
        shot_list: shotList,
        aspect_ratio: aspectRatio,
      };

      const { data: concept, error } = await supabase
        .from('ad_concepts')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { ...concept, structured_prompt: concept.structured_prompt as unknown as FiboStructuredPrompt } as DbAdConcept;
    } catch (error) {
      console.error('Error saving concept:', error);
      toast({ title: "Error saving concept", variant: "destructive" });
      return null;
    }
  };

  const saveGeneratedImage = async (
    imageUrl: string,
    structuredPrompt: FiboStructuredPrompt,
    aspectRatio: string,
    seed?: number,
    campaignId?: string,
    conceptId?: string,
    cameraSettings?: CameraSettings,
    visualSettings?: VisualSettings,
    generationType: 'initial' | 'camera_edit' | 'visual_edit' = 'initial',
    parentImageId?: string
  ): Promise<GeneratedImageDb | null> => {
    try {
      let version = 1;
      if (parentImageId) {
        const { data: parent } = await supabase
          .from('generated_images')
          .select('version')
          .eq('id', parentImageId)
          .maybeSingle();
        if (parent) version = parent.version + 1;
      }

      const insertData = {
        image_url: imageUrl,
        structured_prompt: structuredPrompt as unknown as Json,
        aspect_ratio: aspectRatio,
        seed: seed ?? null,
        campaign_id: campaignId ?? null,
        concept_id: conceptId ?? null,
        camera_settings: (cameraSettings as unknown as Json) ?? null,
        visual_settings: (visualSettings as unknown as Json) ?? null,
        generation_type: generationType,
        parent_image_id: parentImageId ?? null,
        version,
      };

      const { data: image, error } = await supabase
        .from('generated_images')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return {
        ...image,
        structured_prompt: image.structured_prompt as unknown as FiboStructuredPrompt,
        camera_settings: image.camera_settings as unknown as CameraSettings | null,
        visual_settings: image.visual_settings as unknown as VisualSettings | null,
        generation_type: image.generation_type as GeneratedImageDb['generation_type'],
      } as GeneratedImageDb;
    } catch (error) {
      console.error('Error saving image:', error);
      toast({ title: "Error saving image", variant: "destructive" });
      return null;
    }
  };

  const getImageVersions = async (imageId: string): Promise<GeneratedImageDb[]> => {
    try {
      const { data: allImages } = await supabase
        .from('generated_images')
        .select('*')
        .order('version', { ascending: true });

      return (allImages || []).map(img => ({
        ...img,
        structured_prompt: img.structured_prompt as unknown as FiboStructuredPrompt,
        camera_settings: img.camera_settings as unknown as CameraSettings | null,
        visual_settings: img.visual_settings as unknown as VisualSettings | null,
        generation_type: img.generation_type as GeneratedImageDb['generation_type'],
      }));
    } catch (error) {
      console.error('Error getting versions:', error);
      return [];
    }
  };

  return { saveCampaign, saveConcept, saveGeneratedImage, getImageVersions };
}
