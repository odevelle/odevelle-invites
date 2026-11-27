/*
 * A small PSD layer compositor driven by the developer handoff manifest
 * (asset-manifest.json: per-layer PNG, position, opacity, blend mode, mask,
 * clipping). It reproduces Photoshop's blend formulas in gamma space so a set
 * of layers can be re-rendered without their text, or exported on their own.
 *
 * It can't see layer styles or adjustment layers (the handoff doesn't include
 * them), so results are compared against the saved Photoshop composite and,
 * where needed, colour-fitted to it.
 */
import path from "node:path";
import { readFileSync } from "node:fs";
import sharp from "sharp";

export function openHandoff(root) {
  const manifest = JSON.parse(readFileSync(path.join(root, "asset-manifest.json"), "utf8"));
  const artboards = Object.fromEntries(manifest.artboards.map((a) => [a.name, a]));
  const layers = new Map(manifest.layers.map((l) => [l.layer_id, l]));
  return { root, manifest, artboards, layers };
}

export async function loadRGBA(file) {
  const { data, info } = await sharp(file).toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

async function loadGray(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, c: info.channels };
}

const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const screen = (b, s) => b + s - b * s;
const BLEND = {
  normal: (b, s) => s,
  multiply: (b, s) => b * s,
  screen,
  "hard-light": (b, s) => (s <= 0.5 ? b * 2 * s : screen(b, 2 * s - 1)),
  overlay: (b, s) => (b <= 0.5 ? s * 2 * b : screen(s, 2 * b - 1)),
  "soft-light": (b, s) => (s <= 0.5 ? 2 * b * s + b * b * (1 - 2 * s) : 2 * b * (1 - s) + Math.sqrt(b) * (2 * s - 1)),
  lighten: (b, s) => Math.max(b, s),
  darken: (b, s) => Math.min(b, s),
  lLit: (b, s) => clamp(b + 2 * s - 1), // linear light
  pLit: (b, s) => (s <= 0.5 ? Math.min(b, 2 * s) : Math.max(b, 2 * s - 1)), // pin light
};

/** A float RGBA canvas in artboard coordinates [left, left + width) × [top, top + height). */
export function canvas(width, height, { left = 0, top = 0, fill = [1, 1, 1, 1] } = {}) {
  const rgb = new Float32Array(width * height * 3);
  const a = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    rgb[i * 3] = fill[0];
    rgb[i * 3 + 1] = fill[1];
    rgb[i * 3 + 2] = fill[2];
    a[i] = fill[3];
  }
  return { w: width, h: height, left, top, rgb, a };
}

/**
 * Composites the given manifest layers (bottom to top) onto `cv`.
 * `overrides[layerId]` can replace the layer image ({ img }) or force fields
 * ({ blend_mode, opacity, x, y }).
 */
export async function drawLayers(handoff, cv, layerIds, overrides = {}) {
  let baseAlpha = null;
  for (const id of layerIds) {
    const src = handoff.layers.get(id);
    if (!src) throw new Error(`layer ${id} not in manifest`);
    const ov = overrides[id] ?? {};
    const L = { ...src, ...ov };
    const img = ov.img ?? (await loadRGBA(path.join(handoff.root, L.asset)));
    const ab = handoff.artboards[L.artboard];
    let mask = null;
    let mb = null;
    if (L.mask_asset && !ov.noMask) {
      mask = await loadGray(path.join(handoff.root, L.mask_asset));
      mb = { top: L.mask_bounds[0], left: L.mask_bounds[1] - ab.bounds[0], bottom: L.mask_bounds[2], right: L.mask_bounds[3] - ab.bounds[0] };
    }
    const fn = BLEND[L.blend_mode];
    if (!fn) throw new Error(`unsupported blend ${L.blend_mode} on ${id}`);
    const lw = ov.img ? img.w : L.width;
    const lh = ov.img ? img.h : L.height;
    const thisAlpha = L.clipping ? null : new Float32Array(cv.w * cv.h);
    for (let y = 0; y < cv.h; y++) {
      const ay = y + cv.top;
      const ly = ay - L.y;
      if (ly < 0 || ly >= lh) continue;
      for (let x = 0; x < cv.w; x++) {
        const ax = x + cv.left;
        const lx = ax - L.x;
        if (lx < 0 || lx >= lw) continue;
        const p = (Math.min(img.h - 1, ly) * img.w + Math.min(img.w - 1, lx)) * 4;
        const ia = img.data[p + 3] / 255;
        let mv = 1;
        if (mask) {
          mv = ay < mb.top || ay >= mb.bottom || ax < mb.left || ax >= mb.right ? 0 : mask.data[((ay - mb.top) * mask.w + (ax - mb.left)) * mask.c] / 255;
        }
        const ci = y * cv.w + x;
        if (thisAlpha) thisAlpha[ci] = ia * mv;
        let a = ia * mv * L.opacity;
        if (L.clipping) a *= baseAlpha ? baseAlpha[ci] : 0;
        if (a <= 0) continue;
        const ab_ = cv.a[ci];
        const ar = a + ab_ * (1 - a);
        const k = a / ar;
        for (let c = 0; c < 3; c++) {
          const cs = img.data[p + c] / 255;
          const cb = cv.rgb[ci * 3 + c];
          cv.rgb[ci * 3 + c] = (1 - k) * cb + k * ((1 - ab_) * cs + ab_ * fn(cb, cs));
        }
        cv.a[ci] = ar;
      }
    }
    if (thisAlpha) baseAlpha = thisAlpha;
  }
  return cv;
}

/** Raw 8-bit RGBA buffer of a canvas. */
export function toBuffer(cv, { alpha = true } = {}) {
  const ch = alpha ? 4 : 3;
  const buf = Buffer.alloc(cv.w * cv.h * ch);
  for (let i = 0; i < cv.w * cv.h; i++) {
    for (let c = 0; c < 3; c++) buf[i * ch + c] = Math.round(clamp(cv.rgb[i * 3 + c]) * 255);
    if (alpha) buf[i * ch + 3] = Math.round(clamp(cv.a[i]) * 255);
  }
  return sharp(buf, { raw: { width: cv.w, height: cv.h, channels: ch } });
}

/** Loads a region of a flat reference image into a float canvas. */
export async function canvasFromImage(file, { left, top, width, height }) {
  const { data, info } = await sharp(file).extract({ left, top, width, height }).toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cv = canvas(info.width, info.height, { left, top, fill: [0, 0, 0, 0] });
  for (let i = 0; i < cv.w * cv.h; i++) {
    for (let c = 0; c < 3; c++) cv.rgb[i * 3 + c] = data[i * 4 + c] / 255;
    cv.a[i] = data[i * 4 + 3] / 255;
  }
  return cv;
}
