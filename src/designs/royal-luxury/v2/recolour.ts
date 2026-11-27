/*
 * Colourway recolouring: moves the design's burgundy to another ground colour
 * while leaving gold, pearls, ivory and flowers alone.
 *
 * Shared by the asset pipeline (scripts/design-assets/colourway.mjs recolours
 * every pixel of the artwork) and the theme (recolours the flat CSS colours
 * the same way), so artwork and backgrounds always agree.
 *
 * Works in CIE LCh: a pixel counts as "burgundy" by how close its hue is to
 * the source ground and how saturated it is; its lightness and chroma move by
 * the source → target offset/ratio, so velvet keeps its folds and sheen.
 *
 * Kept free of imports so Node can run it directly (type stripping).
 */

export type RecolourRecipe = {
  /** The ground colour of the original artwork (Cherry red's burgundy). */
  from: string;
  /** The ground colour it becomes. */
  to: string;
};

type Lch = [l: number, c: number, h: number];

const D65 = [0.95047, 1, 1.08883] as const;

const toLinear = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
};
const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fInv = (t: number) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));

function rgbToLch(r: number, g: number, b: number): Lch {
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  const x = f((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / D65[0]);
  const y = f(0.2126729 * R + 0.7151522 * G + 0.072175 * B);
  const z = f((0.0193339 * R + 0.119192 * G + 0.9503041 * B) / D65[2]);
  const L = 116 * y - 16;
  const A = 500 * (x - y);
  const Bb = 200 * (y - z);
  return [L, Math.hypot(A, Bb), (Math.atan2(Bb, A) * 180) / Math.PI];
}

function labToRgb(L: number, A: number, Bb: number): [number, number, number] {
  const y = (L + 16) / 116;
  const X = fInv(y + A / 500) * D65[0];
  const Y = fInv(y);
  const Z = fInv(y - Bb / 200) * D65[2];
  return [
    fromLinear(3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z),
    fromLinear(-0.969266 * X + 1.8760108 * Y + 0.041556 * Z),
    fromLinear(0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z),
  ];
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const parseHex = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = ([r, g, b]: [number, number, number]) => `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;

/*
 * Measured on the artwork: burgundy (velvet, silk, line drawings) sits at hue
 * 10–40° and lightness under 55; the peach icons, ivory paper and lace at hue
 * 40–70° and lightness over 60; gold at 60–90°. So a pixel moves fully within
 * 18° of the source hue, not at all beyond 32°, and only while it is dark:
 * light materials keep their own colour (no blotchy half-shifts), and
 * near-greys (pearls, white lace) are left alone by chroma.
 */
const HUE_FULL = 18;
const HUE_NONE = 32;
const CHROMA_NONE = 6;
const CHROMA_FULL = 18;
const LIGHT_FULL = 45;
const LIGHT_NONE = 65;

/** A pixel mapper for one recipe: (r, g, b) in 0–255 → recoloured [r, g, b]. */
export function makeRecolour({ from, to }: RecolourRecipe) {
  const [Ls, Cs, hs] = rgbToLch(...parseHex(from));
  const [Lt, Ct, ht] = rgbToLch(...parseHex(to));
  const chromaRatio = Ct / Cs;

  return (r: number, g: number, b: number): [number, number, number] => {
    const [L, C, h] = rgbToLch(r, g, b);
    const w =
      (1 - smoothstep(HUE_FULL, HUE_NONE, hueDistance(h, hs))) *
      smoothstep(CHROMA_NONE, CHROMA_FULL, C) *
      (1 - smoothstep(LIGHT_FULL, LIGHT_NONE, L));
    if (w <= 0.001) return [r, g, b];
    // Moved colour: same offset from the ground in lightness, same ratio in
    // chroma, and the hue spread halved around the new hue.
    let dh = h - hs;
    if (dh > 180) dh -= 360;
    if (dh < -180) dh += 360;
    const L2 = Math.min(100, Math.max(0, Lt + (L - Ls)));
    const C2 = C * chromaRatio;
    const h2 = ((ht + dh * 0.5) * Math.PI) / 180;
    // Blend in Lab between the original and the moved colour.
    const hr = (h * Math.PI) / 180;
    const a = (1 - w) * C * Math.cos(hr) + w * C2 * Math.cos(h2);
    const bb = (1 - w) * C * Math.sin(hr) + w * C2 * Math.sin(h2);
    return labToRgb((1 - w) * L + w * L2, a, bb);
  };
}

/** Recolours one #rrggbb colour. */
export function recolourHex(hex: string, recipe: RecolourRecipe): string {
  return toHex(makeRecolour(recipe)(...parseHex(hex)));
}
