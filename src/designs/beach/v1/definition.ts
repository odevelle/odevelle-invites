import { z } from "zod";
import { defineAppearanceSchema } from "@/invitation/schema/appearance";
import { FEATURE_KEYS } from "@/invitation/schema/features";
import { defineDesign } from "../../define";

/*
 * Beach v1: warm sand, layered waves, a scallop shell and pearls.
 * Variant lists are the initial set; finalise with design before Phase 3 ships.
 */

const optionsSchema = z.strictObject({
  intro: z.enum(["envelope", "wave-reveal"]),
  /** Wave band at the foot of the card. */
  waves: z.enum(["layered", "calm"]),
  /** Top-of-card emblem. */
  emblem: z.enum(["scallop", "none"]),
});

const appearanceSchema = defineAppearanceSchema({
  heading: ["bodoni-moda", "great-vibes"],
  body: ["manrope"],
});

export const beachV1 = defineDesign({
  id: "beach",
  version: 1,
  release: "provisional",
  tier: "catalogue",
  occasions: ["wedding", "engagement", "birthday", "anniversary"],
  supportedFeatures: FEATURE_KEYS,
  optionsSchema,
  appearanceSchema,
  palettePresets: [
    {
      key: "sand-sea",
      label: "Sand & sea",
      palette: { primary: "#1f4e52", secondary: "#5e9e9e", background: "#fbf3e4", accent: "#c99a86" },
    },
  ],
  defaults: {
    options: { intro: "envelope", waves: "layered", emblem: "scallop" },
    appearance: {
      palette: { primary: "#1f4e52", secondary: "#5e9e9e", background: "#fbf3e4", accent: "#c99a86" },
      headingFont: "bodoni-moda",
      bodyFont: "manrope",
      scale: "standard",
    },
  },
});
