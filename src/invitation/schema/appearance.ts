import { z } from "zod";
import { hexColor } from "./primitives";

/*
 * Appearance (`invitations.appearance`): the personalisation a design allows.
 * Colours are #RRGGBB only; fonts are keys from the design's own font set
 * (loaded with next/font by that design), never URLs or arbitrary families.
 */

export const palette = z.strictObject({
  primary: hexColor,
  secondary: hexColor,
  background: hexColor,
  accent: hexColor,
});
export type Palette = z.infer<typeof palette>;

export const TYPE_SCALES = ["compact", "standard", "large"] as const;
export type TypeScale = (typeof TYPE_SCALES)[number];

type FontKeys = readonly [string, ...string[]];

/** Builds a design's appearance schema from the fonts it ships. */
export function defineAppearanceSchema<const H extends FontKeys, const B extends FontKeys>(fonts: {
  heading: H;
  body: B;
}) {
  return z.strictObject({
    palette,
    headingFont: z.enum(fonts.heading),
    bodyFont: z.enum(fonts.body),
    scale: z.enum(TYPE_SCALES),
  });
}

/** The shape every design's appearance shares, whatever its font keys. */
export type BaseAppearance = {
  palette: Palette;
  headingFont: string;
  bodyFont: string;
  scale: TypeScale;
};
