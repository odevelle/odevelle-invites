import { z } from "zod";
import { defineAppearanceSchema } from "@/invitation/schema/appearance";
import { FEATURE_KEYS } from "@/invitation/schema/features";
import { defineDesign } from "../../define";

/*
 * Royal Luxury v1: lace edging, strings of pearls and a small crest.
 * Variant lists are the initial set; finalise with design before Phase 3 ships.
 */

const optionsSchema = z.strictObject({
  /** Opening animation. */
  intro: z.enum(["envelope", "lace-curtain"]),
  /** Top-of-card emblem. */
  emblem: z.enum(["crest", "monogram"]),
  /** Border treatment. */
  border: z.enum(["pearls", "lace"]),
});

const appearanceSchema = defineAppearanceSchema({
  heading: ["great-vibes", "bodoni-moda"],
  body: ["manrope", "bodoni-moda"],
});

export const royalLuxuryV1 = defineDesign({
  id: "royal-luxury",
  version: 1,
  release: "provisional",
  tier: "catalogue",
  occasions: ["wedding", "engagement", "anniversary"],
  supportedFeatures: FEATURE_KEYS,
  optionsSchema,
  appearanceSchema,
  palettePresets: [
    {
      key: "cherry-ivory",
      label: "Cherry & ivory",
      palette: { primary: "#9b1b30", secondary: "#f1e3d0", background: "#fbf4ea", accent: "#cdbb9f" },
    },
  ],
  defaults: {
    options: { intro: "envelope", emblem: "crest", border: "pearls" },
    appearance: {
      palette: { primary: "#9b1b30", secondary: "#f1e3d0", background: "#fbf4ea", accent: "#cdbb9f" },
      headingFont: "great-vibes",
      bodyFont: "manrope",
      scale: "standard",
    },
  },
});
