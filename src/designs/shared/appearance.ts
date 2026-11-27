import type { CSSProperties } from "react";
import type { BaseAppearance, TypeScale } from "@/invitation/schema/appearance";

const SCALE: Record<TypeScale, number> = { compact: 0.92, standard: 1, large: 1.1 };

/**
 * Turns a validated appearance into CSS custom properties on the theme root.
 * Themes style with these variables (e.g. `text-(--inv-primary)`), so the
 * same theme renders each couple's palette, fonts and scale.
 *
 * `fontFamilies` maps the theme's font keys to the actual font-family string
 * (from next/font). Only keys the theme ships can reach here: the appearance
 * schema already rejected anything else.
 */
export function appearanceVars(appearance: BaseAppearance, fontFamilies: Record<string, string>): CSSProperties {
  const { palette } = appearance;
  return {
    "--inv-primary": palette.primary,
    "--inv-secondary": palette.secondary,
    "--inv-background": palette.background,
    "--inv-accent": palette.accent,
    "--inv-heading-font": fontFamilies[appearance.headingFont],
    "--inv-body-font": fontFamilies[appearance.bodyFont],
    "--inv-scale": String(SCALE[appearance.scale]),
  } as CSSProperties;
}
