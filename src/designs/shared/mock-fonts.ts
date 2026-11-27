import { Bodoni_Moda, Great_Vibes, Manrope } from "next/font/google";

/*
 * Fonts for the provisional mock themes only. Self-hosted by next/font.
 * Real themes declare their own fonts in their own folder, so replacing a mock
 * doesn't touch the others.
 */

const bodoniModa = Bodoni_Moda({ subsets: ["latin", "latin-ext"], style: ["normal", "italic"], axes: ["opsz"], display: "swap" });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin", "latin-ext"], display: "swap" });
const manrope = Manrope({ subsets: ["latin", "latin-ext"], display: "swap" });

/** Font key (as used in appearance schemas) → CSS font-family. */
export const mockFontFamilies: Record<string, string> = {
  "bodoni-moda": bodoniModa.style.fontFamily,
  "great-vibes": greatVibes.style.fontFamily,
  manrope: manrope.style.fontFamily,
};
