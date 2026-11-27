import type { z } from "zod";
import type { Occasion } from "@/invitation/schema/identity";
import type { BaseAppearance, Palette } from "@/invitation/schema/appearance";
import type { FeatureKey } from "@/invitation/schema/features";
import type { DesignId } from "./catalogue";

export type DesignTier = "catalogue" | "bespoke";

/**
 * "provisional": a temporary implementation (the current mock themes). It must
 * never host a customer invitation, and is retired once the real design ships.
 * "released": a customer-facing version. From then on it is frozen: any visual
 * change ships as a new version number.
 */
export type DesignRelease = "provisional" | "released";

export type PalettePreset = { key: string; label: string; palette: Palette };

/**
 * Everything the platform needs to know about one version of one design,
 * without loading any of its UI.
 *
 * Phase 3 adds `load()` (a static dynamic import of the design's React entry)
 * in the registry, next to this definition.
 *
 * Versioning rule: a change that would alter how an existing invitation looks
 * or validate its stored options differently ships as a new version folder.
 * Invitations stay pinned to the version they were built with.
 */
export type DesignDefinition<
  Options extends z.ZodType = z.ZodType,
  Appearance extends z.ZodType<BaseAppearance> = z.ZodType<BaseAppearance>,
> = {
  id: DesignId;
  version: number;
  release: DesignRelease;
  tier: DesignTier;
  occasions: readonly Occasion[];
  /** Features this design has UI for. A package can't switch on what a design can't show. */
  supportedFeatures: readonly FeatureKey[];
  /** Layout and presentation variants (`invitations.design_options`). */
  optionsSchema: Options;
  /**
   * Option keys that choose colours rather than layout (e.g. a colourway).
   * Packages limited to the default layout may still set them; every value
   * is a curated one, so they're no more than a palette preset.
   */
  colourOptions?: readonly string[];
  /** Allowed personalisation (`invitations.appearance`). */
  appearanceSchema: Appearance;
  /** Curated palettes. Classic invitations must use one of these. */
  palettePresets: readonly [PalettePreset, ...PalettePreset[]];
  /** What a new invitation starts with; also what Classic is held to for layout and fonts. */
  defaults: { options: z.infer<Options>; appearance: z.infer<Appearance> };
};

/** A definition with its generics erased, for registry storage and lookups. */
export type AnyDesignDefinition = DesignDefinition<z.ZodType, z.ZodType<BaseAppearance>>;
