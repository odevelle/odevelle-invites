import type { ComponentType } from "react";
import type { BaseAppearance } from "@/invitation/schema/appearance";
import type { EffectiveFeatures } from "@/invitation/schema/features";
import type { InvitationView } from "@/invitation/view";

/**
 * The contract between the rendering engine and a theme version.
 *
 * A theme is free in everything visual: layout, components, fonts, animation,
 * section order. It is not free in what it receives: every theme gets exactly
 * these props, so any invitation can move between themes (or theme versions)
 * without its data changing.
 *
 * `options` and `appearance` arrive already validated against this version's
 * schemas. They're typed loosely here so one map can hold every theme; each
 * theme narrows them by parsing with its own schema (cheap, and type-safe).
 */
export type ThemeProps = {
  invitation: InvitationView;
  options: unknown;
  appearance: BaseAppearance;
  /** Resolved package ∩ design ∩ invitation. Themes check these, never the package. */
  features: EffectiveFeatures;
};

export type ThemeComponent = ComponentType<ThemeProps>;

/** A static dynamic import of a theme version's entry: each theme is its own chunk. */
export type ThemeLoader = () => Promise<{ default: ThemeComponent }>;
