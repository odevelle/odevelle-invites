import type { AnyDesignDefinition } from "@/designs/types";
import type { BaseAppearance } from "../schema/appearance";
import type { InvitationContent } from "../schema/content";
import { FEATURE_KEYS, type EffectiveFeatures, type FeatureToggles } from "../schema/features";
import type { PackageTier } from "../schema/identity";
import { entitlementsFor } from "./packages";

/**
 * The features a page actually shows:
 *   package grants ∩ design supports ∩ invitation hasn't switched it off.
 * Computed once per render and passed down as props.
 */
export function resolveEffectiveFeatures(
  tier: PackageTier,
  design: AnyDesignDefinition,
  requested: FeatureToggles,
): EffectiveFeatures {
  const grants = entitlementsFor(tier).features;
  const supported = new Set(design.supportedFeatures);
  return Object.fromEntries(
    FEATURE_KEYS.map((key) => [key, grants[key] && supported.has(key) && requested[key] !== false]),
  ) as EffectiveFeatures;
}

export type EntitlementIssue = { path: string; message: string };

export type EntitlementCheckInput = {
  tier: PackageTier;
  design: AnyDesignDefinition;
  designOptions: unknown;
  appearance: BaseAppearance;
  features: FeatureToggles;
  content: InvitationContent;
  galleryItemCount: number;
};

/**
 * Write-time check (dashboard saves, imports): lists everything the package
 * doesn't allow. Render time doesn't need this; it drops unentitled features
 * via resolveEffectiveFeatures as a second line of defence.
 */
export function checkEntitlements(input: EntitlementCheckInput): EntitlementIssue[] {
  const e = entitlementsFor(input.tier);
  const { design } = input;
  const issues: EntitlementIssue[] = [];

  if (!e.designTiers.includes(design.tier)) {
    issues.push({ path: "designId", message: `${design.tier} designs need a package that allows them` });
  }

  if (e.layoutVariants === "default" && !usesDefaultLayout(design, input.designOptions)) {
    issues.push({ path: "designOptions", message: "This package uses the design's default layout" });
  }

  if (e.palette === "presets" && !design.palettePresets.some((p) => deepEqual(p.palette, input.appearance.palette))) {
    issues.push({ path: "appearance.palette", message: "This package uses one of the design's curated palettes" });
  }

  const defaultFonts = design.defaults.appearance as BaseAppearance;
  if (
    e.fonts === "default" &&
    (input.appearance.headingFont !== defaultFonts.headingFont || input.appearance.bodyFont !== defaultFonts.bodyFont)
  ) {
    issues.push({ path: "appearance", message: "This package uses the design's default fonts" });
  }

  for (const key of FEATURE_KEYS) {
    if (input.features[key] === true && !e.features[key]) {
      issues.push({ path: `features.${key}`, message: `${key} isn't included in this package` });
    }
  }

  if (input.galleryItemCount > e.limits.galleryItems) {
    issues.push({ path: "media.gallery", message: `Up to ${e.limits.galleryItems} gallery items in this package` });
  }

  if (input.content.customSections?.length && !e.customSections) {
    issues.push({ path: "content.customSections", message: "Custom sections are an Exclusive feature" });
  }

  return issues;
}

/**
 * Options as stored, with the schema's defaults filled in (so a key added to
 * a design later doesn't count against older invitations) and the colour
 * choices left out: those are held to curated values by the palette rule, not
 * to the default layout.
 */
function usesDefaultLayout(design: AnyDesignDefinition, options: unknown): boolean {
  const parsed = design.optionsSchema.safeParse(options);
  if (!parsed.success) return false;
  const layoutOnly = (o: unknown) =>
    Object.fromEntries(Object.entries(o as Record<string, unknown>).filter(([k]) => !design.colourOptions?.includes(k)));
  return deepEqual(layoutOnly(parsed.data), layoutOnly(design.defaults.options));
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
