import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedImageDb, Campaign, DbAdConcept, FeedItem, CameraSettings, VisualSettings } from "@/types/database";
import { FiboStructuredPrompt } from "@/types/fibo";
import { useToast } from "@/hooks/use-toast";

export function useFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchFeed = async () => {
    if (!userId) {
      setFeedItems([]);
      setIsLoading(false);
      return;
    }

    try {
      // Only fetch images belonging to the current user
      const { data: images, error: imagesError } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      const { data: campaigns } = await supabase.from('campaigns').select('*').eq('user_id', userId);
      const { data: concepts } = await supabase.from('ad_concepts').select('*').eq('user_id', userId);

      const enrichedItems: FeedItem[] = (images || []).map((img) => ({
        ...img,
        structured_prompt: img.structured_prompt as unknown as FiboStructuredPrompt,
        camera_settings: img.camera_settings as unknown as CameraSettings | null,
        visual_settings: img.visual_settings as unknown as VisualSettings | null,
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
    if (userId !== null) {
      fetchFeed();
    }

    const channel = supabase
      .channel('generated_images_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generated_images' }, () => {
        if (userId) fetchFeed();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { feedItems, isLoading, refetch: fetchFeed };
}
