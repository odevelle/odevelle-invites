import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { artworkFor } from "@/designs/royal-luxury/v2/assets";
import { cherryGrounds, colourwayKeys, colourways } from "@/designs/royal-luxury/v2/colourways";
import { royalLuxuryV2 } from "@/designs/royal-luxury/v2/definition";
import { pearlLayers } from "@/designs/royal-luxury/v2/pearls.generated";
import { recolourHex } from "@/designs/royal-luxury/v2/recolour";

const PUBLIC = path.resolve(__dirname, "../../public");
const exists = (src: string) => existsSync(path.join(PUBLIC, src));

test.describe("Royal Luxury v2 colourways", () => {
  test("invitations saved before colourways existed stay Cherry red", () => {
    expect(royalLuxuryV2.optionsSchema.parse({ intro: "envelope-video", timelineTimes: false }).colourway).toBe("cherry-red");
    expect(() => royalLuxuryV2.optionsSchema.parse({ colourway: "neon-pink", intro: "none", timelineTimes: false })).toThrow();
  });

  test("every colourway is offered as a palette preset of the same key", () => {
    expect(royalLuxuryV2.palettePresets.map((p) => p.key)).toEqual(colourwayKeys);
  });

  test("Cherry red paints exactly the PSD's colours", () => {
    expect(artworkFor("cherry-red").style).toMatchObject({ "--rl2-ground": cherryGrounds.ground, "--rl2-ground-silk": cherryGrounds.silk });
  });

  test("a recoloured colourway's ground is its target colour, and gold is untouched", () => {
    for (const key of colourwayKeys) {
      const cw = colourways[key];
      if (!("recolour" in cw)) continue;
      expect(recolourHex(cw.recolour.from, cw.recolour)).toBe(cw.recolour.to);
      expect(recolourHex("#cc9e63", cw.recolour)).toBe("#cc9e63");
      expect(artworkFor(key).style).toMatchObject({ "--rl2-ground": cw.recolour.to });
    }
  });

  test("every colourway folder has every file the layout uses", () => {
    for (const key of colourwayKeys) {
      const art = artworkFor(key);
      const files = [...Object.values(art.a3), ...Object.values(art.a4), ...Object.values(art.icons)].map((a) => a.src);
      files.push(...pearlLayers.map((l) => `${art.base}/${l.file}`));
      files.push(...["lace-top", "lace-bottom", "mesh-tile", "ampersand"].map((n) => `${art.base}/${n}.webp`));
      if (art.intro) files.push(art.intro.video, art.intro.poster.src);
      expect(files.filter((f) => !exists(f)), key).toEqual([]);
    }
  });
});
