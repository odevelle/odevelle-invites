import { z } from "zod";
import { defineAppearanceSchema } from "@/invitation/schema/appearance";
import type { FeatureKey } from "@/invitation/schema/features";
import { defineDesign } from "../../define";
import type { PalettePreset } from "../../types";
import { colourwayKeys, colourways } from "./colourways";

/*
 * Royal Luxury v2: the released design (Melina's "Cherry Red" PSD).
 *
 * Envelope video intro, lace hero, pearl-framed countdown, location cards,
 * order of the day, dress code, scratch-to-reveal moments, gift note, RSVP
 * and a veiled finale.
 *
 * The design has no story or video section, so those features aren't
 * supported. Content it doesn't present (intro, story, scripture, custom
 * sections) is ignored rather than squeezed in.
 */

const optionsSchema = z.strictObject({
  /**
   * Ground colour of the whole invitation (artwork included); see colourways.ts.
   * Invitations saved before colourways existed are Cherry red.
   */
  colourway: z.enum(colourwayKeys).default("cherry-red"),
  /** Opening: the envelope video (when the colourway has one), or straight to the invitation. */
  intro: z.enum(["envelope-video", "none"]),
  /** Order of the day: show each moment's time. Hidden in the PSD. */
  timelineTimes: z.boolean(),
});

const appearanceSchema = defineAppearanceSchema({
  heading: ["pinyon-script"],
  body: ["newsreader"],
});

const supportedFeatures = ["rsvp", "countdown", "schedule", "maps", "gallery", "music"] as const satisfies readonly FeatureKey[];

export const royalLuxuryV2 = defineDesign({
  id: "royal-luxury",
  version: 2,
  release: "released",
  tier: "catalogue",
  occasions: ["wedding", "engagement", "anniversary"],
  supportedFeatures,
  optionsSchema,
  colourOptions: ["colourway"],
  appearanceSchema,
  /** One per colourway, same key: pick the preset that matches `options.colourway`. */
  palettePresets: colourwayKeys.map((key) => ({ key, label: colourways[key].label, palette: colourways[key].palette })) as [PalettePreset, ...PalettePreset[]],
  defaults: {
    options: { colourway: "cherry-red", intro: "envelope-video", timelineTimes: false },
    appearance: { palette: colourways["cherry-red"].palette, headingFont: "pinyon-script", bodyFont: "newsreader", scale: "standard" },
  },
});
