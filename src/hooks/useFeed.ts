import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedImageDb, Campaign, DbAdConcept, FeedItem } from "@/types/database";
import { FiboStructuredPrompt } from "@/types/fibo";
import { useToast } from "@/hooks/use-toast";

export function useFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeed = async () => {
    try {
      const { data: images, error: imagesError } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      const { data: campaigns } = await supabase.from('campaigns').select('*');
      const { data: concepts } = await supabase.from('ad_concepts').select('*');

      const enrichedItems: FeedItem[] = (images || []).map((img) => ({
        ...img,
        structured_prompt: img.structured_prompt as unknown as FiboStructuredPrompt,
        camera_settings: img.camera_settings as FeedItem['camera_settings'],
        visual_settings: img.visual_settings as FeedItem['visual_settings'],
        generation_type: (img.generation_type || 'initial') as FeedItem['generation_type'],
        campaign: campaigns?.find(c => c.id === img.campaign_id) as Campaign | undefined,
        concept: concepts?.find(c => c.id === img.concept_id) ? {
          ...concepts.find(c => c.id === img.concept_id)!,
          structured_prompt: concepts.find(c => c.id === img.concept_id)!.structured_prompt as unknown as FiboStructuredPrompt,
        } as DbAdConcept : undefined,
      }));

      setFeedItems(enrichedItems);
    } catch (error) {
      console.error('Error fetching feed:', error);
      toast({ title: "Error loading feed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();

    const channel = supabase
      .channel('generated_images_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_images' }, () => fetchFeed())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { feedItems, isLoading, refetch: fetchFeed };
}
