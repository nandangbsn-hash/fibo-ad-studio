import { FiboConfig, DEFAULT_FIBO_CONFIG, AdConcept } from "@/types/fibo";

/**
 * Normalizes a fibo_config from the AI to match our expected structure
 */
export function normalizeFiboConfig(rawConfig: any): FiboConfig {
  // If already has proper structure, return as-is
  if (rawConfig?.model && rawConfig?.input?.camera) {
    return rawConfig as FiboConfig;
  }

  // AI sometimes returns flat structure without model/input wrapper
  const camera = rawConfig?.input?.camera || rawConfig?.camera || DEFAULT_FIBO_CONFIG.input.camera;
  const lighting = rawConfig?.input?.lighting || rawConfig?.lighting || DEFAULT_FIBO_CONFIG.input.lighting;
  const composition = rawConfig?.input?.composition || rawConfig?.composition || DEFAULT_FIBO_CONFIG.input.composition;
  const style = rawConfig?.input?.style || rawConfig?.style || DEFAULT_FIBO_CONFIG.input.style;
  const subject = rawConfig?.input?.subject || rawConfig?.subject || DEFAULT_FIBO_CONFIG.input.subject;
  const adIntent = rawConfig?.input?.ad_intent || rawConfig?.ad_intent || DEFAULT_FIBO_CONFIG.input.ad_intent;

  return {
    model: rawConfig?.model || "fibo-image-1",
    input: {
      camera: {
        angle: camera?.angle ?? 35,
        fov: camera?.fov ?? 28,
        distance: camera?.distance ?? 1.2,
        shot: camera?.shot || camera?.shot_type || "close_up",
        preset: camera?.preset || "hero_product",
      },
      lighting: {
        type: lighting?.type || "studio_soft",
        intensity: lighting?.intensity ?? 0.85,
        position: lighting?.position || "front_top",
        color_temperature: lighting?.color_temperature ?? 5200,
      },
      composition: {
        framing: composition?.framing || "rule_of_thirds",
        background: composition?.background || "minimal_white",
        depth_of_field: composition?.depth_of_field || "shallow",
      },
      style: {
        color_palette: typeof style?.color_palette === 'string' 
          ? style.color_palette 
          : Array.isArray(style?.color_palette) 
            ? "brand_custom" 
            : "brand_warm_luxury",
        contrast: style?.contrast || "medium_high",
        hdr: style?.hdr ?? true,
        grain: style?.grain || "none",
      },
      subject: {
        type: subject?.type || "physical_product",
        name: subject?.name || "Premium Product",
        brand: subject?.brand || "BRAND",
        position: subject?.position || "center",
        context: subject?.context || "premium lifestyle advertising",
      },
      ad_intent: {
        mood: adIntent?.mood || "sleek, luxurious",
        target_audience: adIntent?.target_audience || "urban premium buyers",
        format: adIntent?.format || "instagram_1x1",
        copy_direction: adIntent?.copy_direction || "minimal, clean aesthetic",
      },
    },
  };
}

/**
 * Normalizes concepts returned from the AI
 */
export function normalizeConcepts(concepts: any[]): AdConcept[] {
  return concepts.map((concept) => ({
    name: concept.name || "Untitled Concept",
    description: concept.description || "",
    fibo_config: normalizeFiboConfig(concept.fibo_config),
    shot_list: Array.isArray(concept.shot_list) ? concept.shot_list : [],
  }));
}
