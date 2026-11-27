import type { DesignId } from "./catalogue";
import { isDesignId } from "./catalogue";
import type { ThemeComponent, ThemeLoader } from "./theme";
import type { AnyDesignDefinition } from "./types";
import { beachV1 } from "./beach/v1/definition";
import { floralV1 } from "./floral/v1/definition";
import { portugueseV1 } from "./portuguese/v1/definition";
import { portugueseV2 } from "./portuguese/v2/definition";
import { royalLuxuryV1 } from "./royal-luxury/v1/definition";
import { royalLuxuryV2 } from "./royal-luxury/v2/definition";

/*
 * The design allowlist. A design can only be rendered if it appears here:
 * values from the database are looked up in these literal maps and never used
 * to build an import path.
 *
 * Two maps, same keys:
 *  - definitions: metadata + schemas. No React, so the data layer and tests
 *    can validate invitations without loading any UI.
 *  - loaders: a static `import()` per theme version, so each theme is its own
 *    chunk and only the invitation's theme is ever loaded.
 * A unit test fails if the two maps don't list exactly the same versions.
 *
 * Versioning rules:
 *  - Invitations are pinned to a version; adding a version never changes them.
 *  - A "released" version is frozen. Visual changes ship as a new version.
 *  - A "provisional" version (today's mock themes) never hosts a customer
 *    invitation and is retired once the real theme is released.
 */
const definitions = {
  "royal-luxury": { 1: royalLuxuryV1, 2: royalLuxuryV2 },
  portuguese: { 1: portugueseV1, 2: portugueseV2 },
  floral: { 1: floralV1 },
  beach: { 1: beachV1 },
} as const satisfies Record<DesignId, Record<number, AnyDesignDefinition>>;

const loaders = {
  "royal-luxury": { 1: () => import("./royal-luxury/v1/Theme"), 2: () => import("./royal-luxury/v2/Theme") },
  portuguese: { 1: () => import("./portuguese/v1/Theme"), 2: () => import("./portuguese/v2/Theme") },
  floral: { 1: () => import("./floral/v1/Theme") },
  beach: { 1: () => import("./beach/v1/Theme") },
} as const satisfies Record<DesignId, Record<number, ThemeLoader>>;

type Versions<T> = Record<number, T>;

function lookup<T>(map: Record<DesignId, Versions<T>>, designId: string, version: number): T | null {
  if (!isDesignId(designId) || !Number.isInteger(version)) return null;
  const versions = map[designId];
  return Object.hasOwn(versions, version) ? versions[version] : null;
}

/** The definition for exactly this design and version, or null if it isn't allowlisted. */
export function resolveDesignDefinition(designId: string, version: number): AnyDesignDefinition | null {
  return lookup<AnyDesignDefinition>(definitions, designId, version);
}

/**
 * Loads the theme component for exactly this design and version.
 * Returns null if it isn't registered; rejects if the chunk fails to load
 * (the page turns both into an "unavailable" state).
 */
export async function loadTheme(designId: string, version: number): Promise<ThemeComponent | null> {
  const loader = lookup<ThemeLoader>(loaders, designId, version);
  return loader ? (await loader()).default : null;
}

/** Newest version of a design: what new invitations are created with. */
export function latestDesignVersion(designId: DesignId): number {
  return Math.max(...Object.keys(definitions[designId]).map(Number));
}

/** Every registered definition (for tests and admin tooling). */
export function allDesignDefinitions(): AnyDesignDefinition[] {
  return Object.values(definitions).flatMap((versions) => Object.values(versions as Versions<AnyDesignDefinition>));
}

/** Registered versions per design in each map (for the registry consistency test). */
export function registeredVersions() {
  const keys = (m: Record<DesignId, Versions<unknown>>) =>
    Object.fromEntries(Object.entries(m).map(([id, v]) => [id, Object.keys(v).map(Number).sort()]));
  return { definitions: keys(definitions), loaders: keys(loaders) };
}
