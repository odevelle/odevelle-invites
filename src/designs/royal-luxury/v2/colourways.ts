import type { RecolourRecipe } from "./recolour";

/*
 * Royal Luxury v2 colourways: the same layout in different ground colours.
 *
 * A colourway is a folder of artwork with Cherry red's file names, the
 * palette for its text, the flat ground colours the CSS paints between
 * pieces of artwork, and (optionally) its own envelope intro.
 *
 * Adding one:
 *  1. Add an entry below. With `recolour`, the artwork and ground colours are
 *     derived from Cherry red's by moving its burgundy to `recolour.to`; run
 *       node scripts/design-assets/colourway.mjs <key>
 *     to write the folder. A designer can then replace any file in it.
 *  2. When the designer delivers the colourway's envelope video, put
 *     intro.mp4 + intro-poster.webp in the folder and fill in `intro`.
 *     Until then the invitation opens straight onto the page.
 *
 * Kept free of runtime imports so the asset pipeline can read it with Node.
 */

export type GroundColours = {
  /** The page's ground (behind everything). */
  ground: string;
  /** Behind the hero plate. */
  hero: string;
  /** Bottom of the countdown's gradient. */
  deep: string;
  /** Under the silk texture (order of the day, dress code). */
  silk: string;
  /** Top of the location cards' buttons. */
  raised: string;
  /** The gift envelope's shadow. */
  shade: string;
  /** The music button. */
  music: string;
  /** The intro's backdrop beyond the video (centre, middle, edge). */
  intro1: string;
  intro2: string;
  intro3: string;
  /** Text shadow and the Skip button behind the intro. */
  introShade: string;
};

export type ColourwayIntro = {
  video: string;
  poster: { src: string; w: number; h: number; x: 0; y: 0 };
  /** Where the wax seal sits in the video frame (fractions of width/height). */
  seal: { x: number; y: number };
};

export type Colourway = {
  label: string;
  /** Public folder of this colourway's artwork (same file names as Cherry red's). */
  base: string;
  /** Text colours (`appearance.palette`); offered as this design's palette preset of the same key. */
  palette: { primary: string; secondary: string; background: string; accent: string };
  /** Derive the artwork and ground colours from Cherry red's. Omit when the designer supplies them. */
  recolour?: RecolourRecipe;
  /** Explicit ground colours (win over the derived ones). */
  grounds?: Partial<GroundColours>;
  /** The colourway's envelope intro, once the designer has delivered it. */
  intro: ColourwayIntro | null;
};

const V2 = "/designs/royal-luxury/v2";

/** Cherry red's ground colours, read off the PSD. Every other colourway starts from these. */
export const cherryGrounds: GroundColours = {
  ground: "#5d010a",
  hero: "#5c010a",
  deep: "#510007",
  silk: "#490004",
  raised: "#6e010e",
  shade: "#140003",
  music: "#340007",
  intro1: "#5b0610",
  intro2: "#330307",
  intro3: "#1e0104",
  introShade: "#280006",
};

export const colourways = {
  /** The PSD as designed. Its artwork is the v2 folder itself. */
  "cherry-red": {
    label: "Cherry red",
    base: V2,
    palette: { primary: "#5c0008", secondary: "#fce8d8", background: "#ffecdd", accent: "#cc9e63" },
    intro: {
      video: `${V2}/intro.mp4`,
      poster: { src: `${V2}/intro-poster.webp`, w: 720, h: 1280, x: 0, y: 0 },
      seal: { x: 0.524, y: 0.523 },
    },
  },
  "sage-green": {
    label: "Sage green",
    base: `${V2}/colourways/sage-green`,
    palette: { primary: "#4a5a44", secondary: "#fce8d8", background: "#ffecdd", accent: "#cc9e63" },
    recolour: { from: cherryGrounds.ground, to: "#4b5b45" },
    // Envelope video to come from the designer.
    intro: null,
  },
  
} as const satisfies Record<string, Colourway>;

export type ColourwayKey = keyof typeof colourways;

export const colourwayKeys = Object.keys(colourways) as [ColourwayKey, ...ColourwayKey[]];
