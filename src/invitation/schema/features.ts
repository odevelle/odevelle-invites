import { z } from "zod";

/** Optional invitation sections. Packages grant them; designs support them; invitations switch them on. */
export const FEATURE_KEYS = [
  "rsvp",
  "countdown",
  "schedule",
  "maps",
  "story",
  "gallery",
  "music",
  "video",
] as const;
export const featureKey = z.enum(FEATURE_KEYS);
export type FeatureKey = z.infer<typeof featureKey>;

/**
 * What an invitation asks for (`invitations.features`). Absent means "on if
 * entitled"; `false` switches an entitled feature off for this invitation.
 */
export const featureToggles = z.partialRecord(featureKey, z.boolean());
export type FeatureToggles = z.infer<typeof featureToggles>;

/** The resolved set the renderer receives: every key present, true or false. */
export type EffectiveFeatures = Record<FeatureKey, boolean>;
