import { z } from "zod";
import { defineAppearanceSchema } from "@/invitation/schema/appearance";
import { FEATURE_KEYS } from "@/invitation/schema/features";
import { defineDesign } from "../../define";

/*
 * Floral v1: embroidered sage florals on linen, scattered beads.
 * Variant lists are the initial set; finalise with design before Phase 3 ships.
 */

const optionsSchema = z.strictObject({
  intro: z.enum(["envelope", "petal-fall"]),
  /** Garland placement. */
  garland: z.enum(["arch", "corners"]),
  /** Linen texture behind the card. */
  texture: z.enum(["linen", "plain"]),
});

const appearanceSchema = defineAppearanceSchema({
  heading: ["great-vibes", "bodoni-moda"],
  body: ["manrope", "bodoni-moda"],
});

export const floralV1 = defineDesign({
  id: "floral",
  version: 1,
  release: "provisional",
  tier: "catalogue",
  occasions: ["wedding", "engagement", "birthday", "anniversary", "baptism"],
  supportedFeatures: FEATURE_KEYS,
  optionsSchema,
  appearanceSchema,
  palettePresets: [
    {
      key: "sage-linen",
      label: "Sage & linen",
      palette: { primary: "#6f8460", secondary: "#3f5236", background: "#f8f6ee", accent: "#e3c77a" },
    },
  ],
  defaults: {
    options: { intro: "envelope", garland: "arch", texture: "linen" },
    appearance: {
      palette: { primary: "#6f8460", secondary: "#3f5236", background: "#f8f6ee", accent: "#e3c77a" },
      headingFont: "great-vibes",
      bodyFont: "manrope",
      scale: "standard",
    },
  },
});
