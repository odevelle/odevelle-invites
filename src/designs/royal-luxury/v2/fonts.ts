import { Aboreto, Newsreader, Pinyon_Script } from "next/font/google";

/*
 * Royal Luxury v2 typography, self-hosted by next/font.
 *
 * The PSD uses:
 *  - Classic Script MN (headings, names). Commercial (© Mecanorma, "licensed,
 *    not sold"); serving it on the web needs a webfont licence. Pinyon Script
 *    is the closest open-licence match (same copperplate construction, slightly
 *    heavier); sizes are set from the PSD's measured text widths. With a
 *    licence, load the file with next/font/local here and keep the
 *    "pinyon-script" key's sizes, or add a new key in a new theme version.
 *  - Newsreader 36pt (body): the variable Newsreader with its optical-size axis.
 *  - Aboreto (the RSVP heading).
 *
 * Only the Latin subset is preloaded; Latin Extended files are still declared
 * (unicode-range) and download only when a name actually needs them.
 */

export const scriptFont = Pinyon_Script({ weight: "400", subsets: ["latin"], display: "swap" });

export const serifFont = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

/** Only the RSVP heading uses it, far below the fold: not preloaded. */
export const capsFont = Aboreto({ weight: "400", subsets: ["latin"], display: "swap", preload: false });

/** Appearance font key → CSS font-family. */
export const fontFamilies: Record<string, string> = {
  "pinyon-script": scriptFont.style.fontFamily,
  newsreader: serifFont.style.fontFamily,
};
