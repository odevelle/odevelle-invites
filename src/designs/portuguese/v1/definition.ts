import { z } from "zod";
import { defineAppearanceSchema } from "@/invitation/schema/appearance";
import { FEATURE_KEYS } from "@/invitation/schema/features";
import { defineDesign } from "../../define";

/*
 * Portuguese v1: hand-painted azulejo tiles, yellow beadwork and a verse.
 * Variant lists are the initial set; finalise with design before Phase 3 ships.
 */

const optionsSchema = z.strictObject({
  intro: z.enum(["envelope", "tile-reveal"]),
  /** Where the tile pattern sits. */
  tiles: z.enum(["top-and-bottom", "full-frame"]),
  /** Show `content.scripture` under the opening. */
  showScripture: z.boolean(),
});

const appearanceSchema = defineAppearanceSchema({
  heading: ["bodoni-moda", "great-vibes"],
  body: ["manrope"],
});

export const portugueseV1 = defineDesign({
  id: "portuguese",
  version: 1,
  release: "provisional",
  tier: "catalogue",
  occasions: ["wedding", "engagement", "baptism", "confirmation", "anniversary"],
  supportedFeatures: FEATURE_KEYS,
  optionsSchema,
  appearanceSchema,
  palettePresets: [
    {
      key: "azulejo-blue",
      label: "Azulejo blue",
      palette: { primary: "#2f5da8", secondary: "#1f3f7a", background: "#fbf8f1", accent: "#e8b83a" },
    },
  ],
  defaults: {
    options: { intro: "envelope", tiles: "top-and-bottom", showScripture: true },
    appearance: {
      palette: { primary: "#2f5da8", secondary: "#1f3f7a", background: "#fbf8f1", accent: "#e8b83a" },
      headingFont: "bodoni-moda",
      bodyFont: "manrope",
      scale: "standard",
    },
  },
});
