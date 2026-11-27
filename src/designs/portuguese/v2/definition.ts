import { z } from "zod";
import { defineAppearanceSchema } from "@/invitation/schema/appearance";
import { FEATURE_KEYS } from "@/invitation/schema/features";
import { defineDesign } from "../../define";

/*
 * Portuguese v2 (provisional mock). Exists to exercise versioning: v2 adds a
 * `layout` option and a different page structure, while invitations pinned to
 * v1 keep rendering v1 unchanged.
 */

const optionsSchema = z.strictObject({
  intro: z.enum(["envelope", "tile-reveal"]),
  /** New in v2: tiles framing a centred card, or running down both sides on wide screens. */
  layout: z.enum(["centred", "side-tiles"]),
  showScripture: z.boolean(),
});

const appearanceSchema = defineAppearanceSchema({
  heading: ["bodoni-moda", "great-vibes"],
  body: ["manrope"],
});

export const portugueseV2 = defineDesign({
  id: "portuguese",
  version: 2,
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
    options: { intro: "tile-reveal", layout: "side-tiles", showScripture: true },
    appearance: {
      palette: { primary: "#2f5da8", secondary: "#1f3f7a", background: "#fbf8f1", accent: "#e8b83a" },
      headingFont: "bodoni-moda",
      bodyFont: "manrope",
      scale: "standard",
    },
  },
});
