#!/usr/bin/env node
/*
 * Writes a Royal Luxury v2 colourway's artwork folder by recolouring Cherry
 * red's (public/designs/royal-luxury/v2/*.webp and pearls/).
 *
 *   node scripts/design-assets/colourway.mjs sage-green   # one colourway
 *   node scripts/design-assets/colourway.mjs              # every colourway with a `recolour` recipe
 *
 * The recipe and the folder come from src/designs/royal-luxury/v2/colourways.ts;
 * the pixel maths from recolour.ts, the same code the theme uses for its flat
 * ground colours, so artwork and CSS agree.
 *
 * Every file is written, so the folder is complete: files with nothing to
 * recolour are copied byte for byte. The envelope intro (intro.mp4,
 * intro-poster.webp) is not: each colourway's video comes from the designer.
 * A designer can replace any generated file with a hand-made one.
 */
import path from "node:path";
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import sharp from "sharp";
import { colourways } from "../../src/designs/royal-luxury/v2/colourways.ts";
import { makeRecolour } from "../../src/designs/royal-luxury/v2/recolour.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const PUBLIC = path.join(ROOT, "public");
const SOURCE = path.join(PUBLIC, colourways["cherry-red"].base);
/** Belong to the colourway's own envelope video, delivered by the designer. */
const NOT_RECOLOURED = new Set(["intro-poster.webp"]);
/** Same encoder settings as royal-luxury-v2.mjs. */
const QUALITY = { "hero.webp": 88, default: 90 };

const files = [
  ...readdirSync(SOURCE).filter((f) => f.endsWith(".webp") && !NOT_RECOLOURED.has(f)),
  ...readdirSync(path.join(SOURCE, "pearls")).filter((f) => f.endsWith(".webp")).map((f) => `pearls/${f}`),
];

const wanted = process.argv.slice(2);
const keys = wanted.length ? wanted : Object.keys(colourways).filter((k) => colourways[k].recolour);

for (const key of keys) {
  const cw = colourways[key];
  if (!cw) throw new Error(`Unknown colourway "${key}". Known: ${Object.keys(colourways).join(", ")}`);
  if (!cw.recolour) throw new Error(`Colourway "${key}" has no recolour recipe (its artwork is supplied by the designer).`);
  const outDir = path.join(PUBLIC, cw.base);
  if (path.resolve(outDir) === path.resolve(SOURCE)) throw new Error(`Colourway "${key}" would overwrite Cherry red's artwork.`);

  console.log(`${key}: ${cw.recolour.from} → ${cw.recolour.to} into ${path.relative(ROOT, outDir)}`);
  const recolour = makeRecolour(cw.recolour);
  // Recolouring per pixel is slow for big plates; flat regions repeat a lot.
  const memo = new Map();
  const map = (r, g, b) => {
    const k = (r << 16) | (g << 8) | b;
    let v = memo.get(k);
    if (!v) memo.set(k, (v = recolour(r, g, b)));
    return v;
  };

  // Regenerated in full, so it never keeps slices or files Cherry red no longer has
  // (anything else in the folder, such as the designer's intro, is left alone).
  mkdirSync(outDir, { recursive: true });
  rmSync(path.join(outDir, "pearls"), { recursive: true, force: true });
  for (const f of readdirSync(outDir)) if (f.endsWith(".webp") && !files.includes(f) && f !== "intro-poster.webp") rmSync(path.join(outDir, f));
  mkdirSync(path.join(outDir, "pearls"), { recursive: true });

  let recoloured = 0;
  for (const file of files) {
    const src = path.join(SOURCE, file);
    const dst = path.join(outDir, file);
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let changed = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const [r, g, b] = map(data[i], data[i + 1], data[i + 2]);
      if (r !== data[i] || g !== data[i + 1] || b !== data[i + 2]) {
        changed++;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
    }
    // Nothing (or next to nothing) to move: keep the original bytes.
    if (changed < info.width * info.height * 0.001) {
      copyFileSync(src, dst);
      continue;
    }
    const { hasAlpha } = await sharp(src).metadata();
    const img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
    await (hasAlpha ? img : img.removeAlpha())
      .webp({ quality: QUALITY[file] ?? QUALITY.default, alphaQuality: 95, effort: 6, smartSubsample: true })
      .toFile(dst);
    recoloured++;
    console.log(`  ${file}: ${((changed / (info.width * info.height)) * 100).toFixed(1)}% of pixels`);
  }
  console.log(`  ${recoloured} recoloured, ${files.length - recoloured} copied`);
}
