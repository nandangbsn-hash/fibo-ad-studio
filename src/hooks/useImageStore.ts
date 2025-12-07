import { supabase } from "@/integrations/supabase/client";
import { FiboStructuredPrompt } from "@/types/fibo";
import { CameraSettings, VisualSettings, Campaign, DbAdConcept, GeneratedImageDb } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useImageStore() {
  const { toast } = useToast();

  const saveCampaign = async (data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          brand_name: data.brand_name || 'Untitled Campaign',
          product_description: data.product_description,
          target_audience: data.target_audience,
          mood: data.mood,
          color_scheme: data.color_scheme,
          category: data.category,
          tone: data.tone,
          key_values: data.key_values,
          recommended_palette: data.recommended_palette,
        })
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
      const { data: concept, error } = await supabase
        .from('ad_concepts')
        .insert({
          campaign_id: campaignId,
          name,
          description,
          structured_prompt: structuredPrompt as unknown as Record<string, unknown>,
          shot_list: shotList,
          aspect_ratio: aspectRatio,
        })
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
          .single();
        if (parent) version = parent.version + 1;
      }

      const { data: image, error } = await supabase
        .from('generated_images')
        .insert({
          image_url: imageUrl,
          structured_prompt: structuredPrompt as unknown as Record<string, unknown>,
          aspect_ratio: aspectRatio,
          seed,
          campaign_id: campaignId,
          concept_id: conceptId,
          camera_settings: cameraSettings as unknown as Record<string, unknown>,
          visual_settings: visualSettings as unknown as Record<string, unknown>,
          generation_type: generationType,
          parent_image_id: parentImageId,
          version,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...image,
        structured_prompt: image.structured_prompt as unknown as FiboStructuredPrompt,
        camera_settings: image.camera_settings as unknown as CameraSettings,
        visual_settings: image.visual_settings as unknown as VisualSettings,
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
        camera_settings: img.camera_settings as unknown as CameraSettings,
        visual_settings: img.visual_settings as unknown as VisualSettings,
        generation_type: img.generation_type as GeneratedImageDb['generation_type'],
      }));
    } catch (error) {
      console.error('Error getting versions:', error);
      return [];
    }
  };

  return { saveCampaign, saveConcept, saveGeneratedImage, getImageVersions };
}
