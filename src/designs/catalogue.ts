/*
 * The design catalogue: stable IDs and editable labels.
 *
 * IDs are permanent. They are stored in `invitations.design_id` and used as
 * registry keys, so never rename or reuse one. Display names, descriptions and
 * marketing labels can change freely without touching existing invitations.
 */

export const CATALOGUE_DESIGN_IDS = ["royal-luxury", "portuguese", "floral", "beach"] as const;
export type CatalogueDesignId = (typeof CATALOGUE_DESIGN_IDS)[number];

/**
 * Bespoke (Exclusive) designs. Each one is still allowlisted here and in the
 * registry, reviewed and deployed like any other code. Use the form
 * "bespoke-<short-name>", e.g. "bespoke-villa-cimbrone".
 */
export const BESPOKE_DESIGN_IDS = [] as const satisfies readonly `bespoke-${string}`[];
export type BespokeDesignId = (typeof BESPOKE_DESIGN_IDS)[number];

export type DesignId = CatalogueDesignId | BespokeDesignId;

export const DESIGN_IDS: readonly DesignId[] = [...CATALOGUE_DESIGN_IDS, ...BESPOKE_DESIGN_IDS];

export function isDesignId(value: string): value is DesignId {
  return (DESIGN_IDS as readonly string[]).includes(value);
}

export type DesignLabel = { displayName: string; description: string };

export const designLabels: Record<CatalogueDesignId, DesignLabel> = {
  "royal-luxury": {
    displayName: "Royal Luxury Theme",
    description: "Lace, pearls and a small crest, in deep cherry and soft ivory. For formal ceremonies and grand receptions.",
  },
  portuguese: {
    displayName: "Portuguese Theme",
    description: "Hand-painted blue and white tiles with yellow and beadwork, framing your names and a verse.",
  },
  floral: {
    displayName: "Floral Theme",
    description: "Florals stitched in sage on off-white linen, scattered with tiny beads. For garden vows and daylight.",
  },
  beach: {
    displayName: "Destination Beach Theme",
    description: "Warm sand, layered waves, a scallop shell and pearls. For coastal and destination celebrations.",
  },
};
