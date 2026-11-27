import { z } from "zod";
import { FEATURE_KEYS } from "../schema/features";
import { PACKAGE_TIERS, type PackageTier } from "../schema/identity";

/*
 * What each package permits. A package is about service scope and allowed
 * customisation; a design is about visual identity. Any design can be paired
 * with any package its tier allows.
 *
 * This config is the only place package rules live. Components receive
 * resolved features (see resolve.ts) and never check the package themselves.
 *
 * ⚠ Numeric limits marked PLACEHOLDER mirror the "[N]" values on the pricing
 * page and need the studio's real figures before launch.
 */

const featureGrants = z.strictObject(
  Object.fromEntries(FEATURE_KEYS.map((k) => [k, z.boolean()])) as Record<(typeof FEATURE_KEYS)[number], z.ZodBoolean>,
);

export const packageEntitlementsSchema = z.strictObject({
  /** Which design tiers the package may use. Only Exclusive may use bespoke designs. */
  designTiers: z.array(z.enum(["catalogue", "bespoke"])).min(1),
  /** "default" = the design's default layout only; "all" = any variant the design offers. */
  layoutVariants: z.enum(["default", "all"]),
  /** "presets" = one of the design's curated palettes; "custom" = any #RRGGBB within the design. */
  palette: z.enum(["presets", "custom"]),
  /** "default" = the design's default fonts; "choices" = any font the design offers. */
  fonts: z.enum(["default", "choices"]),
  features: featureGrants,
  limits: z.strictObject({
    galleryItems: z.number().int().nonnegative(),
    languages: z.number().int().min(1),
    /** Rounds of design refinements included (counted from invitation_versions). */
    revisions: z.number().int().nonnegative(),
  }),
  /** Separate RSVP answers per event (e.g. church and reception). */
  rsvpPerEvent: z.boolean(),
  /** Bespoke sections in `content.customSections`. */
  customSections: z.boolean(),
});

export type PackageEntitlements = z.infer<typeof packageEntitlementsSchema>;

const config = {
  classic: {
    designTiers: ["catalogue"],
    layoutVariants: "default",
    palette: "presets",
    fonts: "default",
    features: { rsvp: true, countdown: true, schedule: true, maps: true, story: false, gallery: false, music: false, video: false },
    limits: { galleryItems: 0, languages: 1, revisions: 1 /* PLACEHOLDER */ },
    rsvpPerEvent: false,
    customSections: false,
  },
  signature: {
    designTiers: ["catalogue"],
    layoutVariants: "all",
    palette: "custom",
    fonts: "choices",
    features: { rsvp: true, countdown: true, schedule: true, maps: true, story: true, gallery: true, music: true, video: false },
    limits: { galleryItems: 24 /* PLACEHOLDER */, languages: 1, revisions: 3 /* PLACEHOLDER */ },
    rsvpPerEvent: true,
    customSections: false,
  },
  exclusive: {
    designTiers: ["catalogue", "bespoke"],
    layoutVariants: "all",
    palette: "custom",
    fonts: "choices",
    features: { rsvp: true, countdown: true, schedule: true, maps: true, story: true, gallery: true, music: true, video: true },
    limits: { galleryItems: 60 /* PLACEHOLDER */, languages: 3 /* PLACEHOLDER */, revisions: 5 /* PLACEHOLDER */ },
    rsvpPerEvent: true,
    customSections: true,
  },
} satisfies Record<PackageTier, PackageEntitlements>;

/** Validated once at module load: a malformed config fails the build, not a guest's page view. */
export const packageEntitlements: Readonly<Record<PackageTier, PackageEntitlements>> = Object.freeze(
  z.strictObject(Object.fromEntries(PACKAGE_TIERS.map((t) => [t, packageEntitlementsSchema])) as Record<PackageTier, typeof packageEntitlementsSchema>).parse(config),
);

export function entitlementsFor(tier: PackageTier): PackageEntitlements {
  return packageEntitlements[tier];
}
