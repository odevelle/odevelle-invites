import type { CSSProperties } from "react";
import { type Colourway, type ColourwayKey, cherryGrounds, colourways, type GroundColours } from "./colourways";
import { recolourHex } from "./recolour";

/*
 * Royal Luxury v2 artwork: generated from the PSD handoff by
 * scripts/design-assets/royal-luxury-v2.mjs into public/designs/royal-luxury/v2
 * (Cherry red), and recoloured per colourway into colourways/<key>/ (see
 * colourways.ts). Every colourway has the same files, so the layout below is
 * shared and only the folder changes.
 *
 * `x`/`y` are the layer's position on its PSD artboard (720px wide), so
 * sections can place each piece exactly where the design has it.
 * Artboard 03 runs from the hero to the dress code; artboard 04 from
 * "Our Moments" to the finale.
 */

export type Asset = { src: string; w: number; h: number; x: number; y: number };

function layout(base: string) {
  const asset = (name: string, w: number, h: number, x = 0, y = 0): Asset => ({ src: `${base}/${name}.webp`, w, h, x, y });
  return {
    /** Artboard 03. */
    a3: {
      hero: asset("hero", 720, 1290),
      countdownBouquetLeft: asset("countdown-bouquet-left", 222, 278, -31, 1518),
      countdownBouquetRight: asset("countdown-bouquet-right", 222, 278, 524, 1508),
      frame: asset("location-frame", 762, 1049, -24, 2235),
      church: asset("church", 505, 631, 91, 2314),
      mansion: asset("mansion", 528, 352, 81, 3468),
      cardBouquet: asset("card-bouquet", 181, 227, 269, 2944),
      strands: asset("crystal-strands", 629, 358, 45, 4310),
      chandelier: asset("chandelier", 291, 304, 214, 4438),
      velvetLeft: asset("velvet-left", 422, 867, -314, 5374),
      velvetRight: asset("velvet-right", 422, 867, 615, 4632),
      silk: asset("silk", 1400, 2504, -340, 4396),
      couple: asset("couple", 384, 579, 165, 6577),
    },
    icons: {
      arch: asset("icon-arch", 144, 143, 379, 4983),
      rings: asset("icon-rings", 155, 117, 494, 5397),
      champagne: asset("icon-champagne", 90, 124, 165, 5705),
      cake: asset("icon-cake", 86, 146, 488, 5978),
      dance: asset("icon-dance", 102, 170, 183, 6184),
    },
    /** Artboard 04. */
    a4: {
      paper: asset("moments-paper", 720, 1100),
      pearlsLeft: asset("moments-pearls-left", 548, 974, -369, -142),
      pearlsRight: asset("moments-pearls-right", 548, 974, 260, 190),
      bouquetLeft: asset("moments-bouquet-left", 424, 522, -188, 279),
      bouquetRight: asset("moments-bouquet-right", 440, 543, 468, 587),
      ovalFrame: asset("oval-frame", 709, 716, 5, 181),
      velvet: asset("gift-velvet", 857, 436, -107, 894),
      envelope: asset("gift-envelope", 750, 1000, -15, 1019),
      rsvpBouquet: asset("rsvp-bouquet", 287, 433, 216, 2116),
      rings: asset("rings", 85, 53, 317, 3372),
      veil: asset("veil", 1221, 822, -257, 3135),
    },
    /** The countdown's animated pearl slices (pearls.generated.ts) live here. */
    base,
  };
}

/** The CSS custom properties theme.css paints a colourway with. */
function cssVars(base: string, grounds: GroundColours): CSSProperties {
  const url = (name: string) => `url("${base}/${name}.webp")`;
  return {
    "--rl2-ground": grounds.ground,
    "--rl2-ground-hero": grounds.hero,
    "--rl2-ground-deep": grounds.deep,
    "--rl2-ground-silk": grounds.silk,
    "--rl2-ground-raised": grounds.raised,
    "--rl2-shade": grounds.shade,
    "--rl2-music": grounds.music,
    "--rl2-intro-1": grounds.intro1,
    "--rl2-intro-2": grounds.intro2,
    "--rl2-intro-3": grounds.intro3,
    "--rl2-intro-shade": grounds.introShade,
    // Generated alongside the artwork; used from theme.css.
    "--rl2-lace-top": url("lace-top"),
    "--rl2-lace-bottom": url("lace-bottom"),
    "--rl2-mesh": url("mesh-tile"),
    "--rl2-amp": url("ampersand"),
  } as CSSProperties;
}

export type Artwork = ReturnType<typeof layout> & {
  /** CSS custom properties for the theme root. */
  style: CSSProperties;
  intro: Colourway["intro"];
};
export type IconKey = keyof Artwork["icons"];

const cache = new Map<ColourwayKey, Artwork>();

/** Everything a colourway changes: its artwork, its ground colours and its intro. */
export function artworkFor(key: ColourwayKey): Artwork {
  const hit = cache.get(key);
  if (hit) return hit;
  const cw: Colourway = colourways[key];
  const recipe = cw.recolour;
  const derived = recipe
    ? (Object.fromEntries(Object.entries(cherryGrounds).map(([k, v]) => [k, recolourHex(v, recipe)])) as GroundColours)
    : cherryGrounds;
  const grounds: GroundColours = { ...derived, ...cw.grounds };
  const artwork: Artwork = { ...layout(cw.base), style: cssVars(cw.base, grounds), intro: cw.intro };
  cache.set(key, artwork);
  return artwork;
}

/** The oval frame's opening (artboard 04), where the scratch card sits. */
export const ovalOpening = { cx: 369.5, cy: 546.5, rx: 152, ry: 199 } as const;
