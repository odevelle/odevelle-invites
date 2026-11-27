#!/usr/bin/env node
/*
 * Builds the web assets for the Royal Luxury v2 theme from Melina's handoff.
 *
 *   node scripts/design-assets/royal-luxury-v2.mjs            # every step
 *   node scripts/design-assets/royal-luxury-v2.mjs hero mesh  # selected steps
 *
 * Input:  design-sources/royal-luxury/ (Cherry_Red_Developer_Assets: layer exports + manifest,
 *         intro video, pearls video). The PSD itself isn't read.
 *         Not in git: too large, and never served.
 * Output: public/designs/royal-luxury/v2/ (committed). Masters are high-quality
 *         WebP; next/image serves resized copies per device.
 *
 * Sources of truth, per asset:
 *  - The saved Photoshop composite where layer styles matter (hero plate,
 *    lace dividers), with live-text areas patched from a re-render.
 *  - Individual layer PNGs for elements that animate or extend past the
 *    720px column on wide screens, colour-fitted to the composite when an
 *    adjustment layer tinted them.
 */
import path from "node:path";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { extractFrames, sliceKeyedAnimation } from "./keyed-video.mjs";
import { canvas, canvasFromImage, drawLayers, loadRGBA, openHandoff, toBuffer } from "./psd-compositor.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const SRC = path.join(ROOT, "design-sources/royal-luxury");
const HANDOFF = path.join(SRC, "Cherry_Red_Developer_Assets");
const OUT = path.join(ROOT, "public/designs/royal-luxury/v2");
const REF3 = path.join(HANDOFF, "references/03-main-invitation.png");
const REF4 = path.join(HANDOFF, "references/04-moments-gift-rsvp-content.png");

const h = openHandoff(HANDOFF);
mkdirSync(OUT, { recursive: true });

const out = (name) => path.join(OUT, name);
const layerFile = (id) => path.join(HANDOFF, h.layers.get(id).asset);
const webp = (s, file, quality = 90) => s.webp({ quality, alphaQuality: 95, effort: 6, smartSubsample: true }).toFile(out(file));

/* ---------------------------------------------------------------- helpers */

/** Full-canvas alpha (0..1) of the given layers' own pixels, in canvas coords. */
async function layerAlpha(cv, ids) {
  const m = new Float32Array(cv.w * cv.h);
  for (const id of ids) {
    const L = h.layers.get(id);
    const img = await loadRGBA(layerFile(id));
    for (let y = 0; y < img.h; y++) {
      const cy = L.y + y - cv.top;
      if (cy < 0 || cy >= cv.h) continue;
      for (let x = 0; x < img.w; x++) {
        const cx = L.x + x - cv.left;
        if (cx < 0 || cx >= cv.w) continue;
        m[cy * cv.w + cx] = Math.max(m[cy * cv.w + cx], img.data[(y * img.w + x) * 4 + 3] / 255);
      }
    }
  }
  return m;
}

/** Gaussian blur of a float mask via sharp. */
async function blurMask(mask, w, hgt, sigma) {
  const buf = Buffer.alloc(w * hgt);
  for (let i = 0; i < w * hgt; i++) buf[i] = Math.round(Math.min(1, mask[i]) * 255);
  const res = await sharp(buf, { raw: { width: w, height: hgt, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer();
  return Float32Array.from(res, (v) => v / 255);
}

/** Grows a mask by ~2σ (blur + threshold), then feathers it. */
async function growMask(mask, w, hgt, grow, feather) {
  const b = await blurMask(mask, w, hgt, grow);
  const t = b.map((v) => (v > 0.03 ? 1 : 0));
  return feather ? blurMask(t, w, hgt, feather) : t;
}

/** Least-squares per-channel gain/offset mapping `src` onto `ref` over the pixels where `where` is true. */
function fitAffine(src, ref, where) {
  const fit = [];
  for (let c = 0; c < 3; c++) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = 0; i < where.length; i++) {
      if (!where[i]) continue;
      const x = src.rgb[i * 3 + c], y = ref.rgb[i * 3 + c];
      n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
    }
    const g = n > 10 ? (n * sxy - sx * sy) / Math.max(1e-9, n * sxx - sx * sx) : 1;
    fit.push({ g, o: n > 10 ? (sy - g * sx) / n : 0 });
  }
  return fit;
}

/* ------------------------------------------------------------------ steps */

const steps = {
  /** The hero: Photoshop composite, with the live-text areas patched from a text-free re-render. */
  async hero() {
    const H = 1290;
    const ref = await canvasFromImage(REF3, { left: 0, top: 0, width: 720, height: H });
    const mine = canvas(720, H);
    await drawLayers(h, mine, [36, 40, 41, 42, 43, 44, 46]);

    const textIds = [72, 73, 74, 75, 76, 77, 78];
    const result = canvas(720, H);
    result.rgb.set(ref.rgb);
    result.a.fill(1);
    // Patch each text block separately with its own local colour fit.
    for (const id of textIds) {
      const alpha = await layerAlpha(mine, [id]);
      const m = await growMask(alpha, 720, H, 3, 2.5);
      const ring = await growMask(alpha, 720, H, 14, 0);
      const where = Uint8Array.from(ring, (v, i) => (v > 0.5 && m[i] < 0.01 ? 1 : 0));
      const fit = fitAffine(mine, ref, where);
      for (let i = 0; i < m.length; i++) {
        if (m[i] <= 0) continue;
        for (let c = 0; c < 3; c++) {
          const v = fit[c].g * mine.rgb[i * 3 + c] + fit[c].o;
          result.rgb[i * 3 + c] = result.rgb[i * 3 + c] * (1 - m[i]) + v * m[i];
        }
      }
    }
    await webp(toBuffer(result, { alpha: false }), "hero.webp", 88);
  },

  /**
   * The PSD's ampersand (Classic Script MN, rendered by the designer), used as a
   * CSS mask so it takes the text colour. Upscaled 4x so edges stay smooth.
   */
  async amp() {
    const src = path.join(HANDOFF, h.layers.get(74).asset);
    const alpha = await sharp(src).ensureAlpha().extractChannel(3).raw().toBuffer();
    const { width, height } = await sharp(src).metadata();
    const big = await sharp(alpha, { raw: { width, height, channels: 1 } })
      .resize(width * 4, height * 4, { kernel: "lanczos3" })
      .sharpen({ sigma: 0.8 })
      .extractChannel(0)
      .raw()
      .toBuffer();
    const rgba = Buffer.alloc(width * 4 * height * 4 * 4);
    for (let i = 0; i < big.length; i++) { rgba[i * 4] = 92; rgba[i * 4 + 1] = 0; rgba[i * 4 + 2] = 8; rgba[i * 4 + 3] = big[i]; }
    await sharp(rgba, { raw: { width: width * 4, height: height * 4, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(out("ampersand.webp"));
  },

  /** Video as delivered: H.264, no audio, moov atom already at the front (fast start). */
  async video() {
    copyFileSync(path.join(SRC, "royal-luxury-theme-intro.mp4"), out("intro.mp4"));
  },

  /** First frame of the intro, so the paused state costs one small image instead of video data. */
  async poster() {
    const { webkit } = await import("playwright");
    const http = await import("node:http");
    const { createReadStream, statSync } = await import("node:fs");
    const file = out("intro.mp4");
    const size = statSync(file).size;
    const server = http.createServer((req, res) => {
      if (req.url === "/") {
        res.writeHead(200, { "content-type": "text/html" });
        return res.end('<body style="margin:0"><video id="v" src="/v.mp4" muted playsinline preload="auto" style="display:block;width:720px;height:1280px"></video></body>');
      }
      const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range ?? "");
      const start = range ? Number(range[1]) : 0;
      const end = range && range[2] ? Number(range[2]) : size - 1;
      res.writeHead(range ? 206 : 200, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-length": end - start + 1, ...(range ? { "content-range": `bytes ${start}-${end}/${size}` } : {}) });
      createReadStream(file, { start, end }).pipe(res);
    });
    await new Promise((r) => server.listen(0, r));
    const browser = await webkit.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1 });
      await page.goto(`http://localhost:${server.address().port}/`);
      await page.waitForFunction(() => document.querySelector("video").readyState >= 2);
      await page.evaluate(() => new Promise((r) => { const v = document.querySelector("video"); v.onseeked = r; v.currentTime = 0.001; }));
      const png = await page.locator("video").screenshot();
      await webp(sharp(png), "intro-poster.webp", 82);
    } finally {
      await browser.close();
      server.close();
    }
  },

  /** Elements used exactly as exported (they match the composite within ~1 level). */
  async elements() {
    const plain = {
      54: "countdown-bouquet-left", 55: "countdown-bouquet-right",
      79: "crystal-strands", 81: "chandelier",
      123: "church", 94: "mansion", 121: "card-bouquet",
      124: "velvet-left", 127: "velvet-right", 149: "couple",
      165: "moments-bouquet-left", 166: "moments-bouquet-right", 176: "oval-frame",
      159: "gift-velvet", 179: "rsvp-bouquet", 184: "rings",
    };
    for (const [id, name] of Object.entries(plain)) await webp(sharp(layerFile(Number(id))), `${name}.webp`);
  },

  /**
   * The countdown's pearl frame, animated: design-sources/royal-luxury/pearls_animated.mp4
   * (the frame drawing itself, then a gold glint) was shot on cream with no
   * alpha, so it's keyed into transparent time slices (see keyed-video.mjs)
   * and replayed with CSS over the burgundy. Aligned to the PSD's pearl layers.
   */
  async pearlsAnimation() {
    const frames = await extractFrames(path.join(SRC, "pearls_animated.mp4"), { fps: 25, count: 150, width: 720, height: 480 });
    const { pearls, layers } = sliceKeyedAnimation(frames, { W: 720, H: 480, fps: 25 });
    // Where the PSD's (static) pearl frame sits on the artboard.
    const psd = canvas(720, 480, { top: 1380, fill: [0, 0, 0, 0] });
    await drawLayers(h, psd, [49, 50, 51, 52]);
    let ax = 720, ay = 1e9;
    for (let i = 0; i < psd.a.length; i++) if (psd.a[i] > 0.25) { ax = Math.min(ax, i % 720); ay = Math.min(ay, psd.top + Math.floor(i / 720)); }
    const dx = ax - pearls.x0, dy = ay - pearls.y0;
    rmSync(out("pearls"), { recursive: true, force: true });
    mkdirSync(out("pearls"), { recursive: true });
    const entries = [];
    for (const l of layers) {
      const name = `pearls/${l.kind}-${l.k}.webp`;
      await sharp(l.data, { raw: { width: l.w, height: l.h, channels: 4 } }).webp({ quality: l.kind === "reveal" ? 82 : 75, alphaQuality: 90, effort: 6 }).toFile(out(name));
      entries.push(`  { kind: "${l.kind}", file: "${name}", x: ${l.x + dx}, y: ${l.y + dy}, w: ${l.w}, h: ${l.h}, at: ${l.at} },`);
    }
    writeFileSync(
      path.join(ROOT, "src/designs/royal-luxury/v2/pearls.generated.ts"),
      `/*\n * Generated by scripts/design-assets/royal-luxury-v2.mjs (pearlsAnimation). Do not edit.\n *\n * The countdown's animated pearl frame as transparent slices: "reveal" slices fade in at\n * \`at\` seconds (the video's draw-in), "glint" slices pulse at \`at\` (its gold glint).\n * \`file\` is relative to the colourway's artwork folder; x/y are artboard-03 coordinates.\n */\n\nexport type PearlLayer = { kind: "reveal" | "glint"; file: string; x: number; y: number; w: number; h: number; at: number };\n\nexport const pearlLayers: readonly PearlLayer[] = [\n${entries.join("\n")}\n];\n`,
    );
    console.log(`  ${layers.length} slices, offset ${dx},${dy}`);
  },

  /** Order-of-the-day icons: white lace in the export, tinted by a multiply colour fill in the PSD. */
  async icons() {
    const names = { 141: "icon-dance", 142: "icon-champagne", 143: "icon-rings", 144: "icon-arch", 145: "icon-cake" };
    const ref = await canvasFromImage(REF3, { left: 0, top: 4900, width: 720, height: 1500 });
    for (const [idStr, name] of Object.entries(names)) {
      const id = Number(idStr);
      const L = h.layers.get(id);
      const img = await loadRGBA(layerFile(id));
      // Gain only (multiply), fitted on opaque pixels.
      const sums = [0, 0, 0, 0, 0, 0];
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
        const p = (y * img.w + x) * 4;
        if (img.data[p + 3] < 250) continue;
        const ri = (L.y + y - ref.top) * ref.w + (L.x + x);
        for (let c = 0; c < 3; c++) { sums[c] += (img.data[p + c] / 255) * ref.rgb[ri * 3 + c]; sums[c + 3] += (img.data[p + c] / 255) ** 2; }
      }
      const gain = [0, 1, 2].map((c) => sums[c] / sums[c + 3]);
      const data = Buffer.from(img.data);
      for (let i = 0; i < img.w * img.h; i++) for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(Math.min(255, img.data[i * 4 + c] * gain[c]));
      await webp(sharp(data, { raw: { width: img.w, height: img.h, channels: 4 } }), `${name}.webp`);
      console.log(`  ${name} gain`, gain.map((g) => g.toFixed(3)).join(" "));
    }
  },

  /** The lace envelope, colour-fitted to undo the PSD's brightness/contrast + hue/saturation adjustments. */
  async envelope() {
    const L = h.layers.get(169);
    const img = await loadRGBA(layerFile(169));
    const ref = await canvasFromImage(REF4, { left: 0, top: 0, width: 720, height: 2040 });
    // Exclude the live text and anything drawn over the envelope.
    const block = canvas(720, 2040, { fill: [0, 0, 0, 0] });
    const cover = await growMask(await layerAlpha(block, [172, 174, 179]), 720, 2040, 8, 0);
    const src = canvas(img.w, img.h, { fill: [0, 0, 0, 0] });
    const tgt = canvas(img.w, img.h, { fill: [0, 0, 0, 0] });
    const where = new Uint8Array(img.w * img.h);
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      const i = y * img.w + x;
      const ax = L.x + x, ay = L.y + y;
      for (let c = 0; c < 3; c++) src.rgb[i * 3 + c] = img.data[i * 4 + c] / 255;
      if (ax < 0 || ax >= 720 || ay >= 2040 || img.data[i * 4 + 3] < 250) continue;
      const ri = ay * 720 + ax;
      if (cover[ri] > 0) continue;
      for (let c = 0; c < 3; c++) tgt.rgb[i * 3 + c] = ref.rgb[ri * 3 + c];
      where[i] = 1;
    }
    const fit = fitAffine(src, tgt, where);
    const data = Buffer.from(img.data);
    for (let i = 0; i < img.w * img.h; i++) for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(Math.max(0, Math.min(255, (fit[c].g * img.data[i * 4 + c]) / 255 * 255 + fit[c].o * 255)));
    await webp(sharp(data, { raw: { width: img.w, height: img.h, channels: 4 } }), "gift-envelope.webp");
    console.log("  envelope fit", fit.map((f) => `${f.g.toFixed(2)}/${(f.o * 255).toFixed(0)}`).join(" "));
  },

  /** Moments pearls: brightened by exposure adjustments in the PSD. */
  async momentsPearls() {
    for (const [id, name] of [[163, "moments-pearls-left"], [161, "moments-pearls-right"]]) {
      await webp(sharp(layerFile(id)).modulate({ brightness: 1.08 }), `${name}.webp`);
    }
  },

  /** Bridal veil: the mask is baked into alpha; the theme applies the PSD's screen blend in CSS. */
  async veil() {
    const L = h.layers.get(178);
    const ab = h.artboards[L.artboard];
    const img = await loadRGBA(layerFile(178));
    const { data: m, info } = await sharp(path.join(HANDOFF, L.mask_asset)).greyscale().raw().toBuffer({ resolveWithObject: true });
    const [mTop, mLeftCanvas] = L.mask_bounds;
    const mLeft = mLeftCanvas - ab.bounds[0];
    const data = Buffer.from(img.data);
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      const mx = L.x + x - mLeft, my = L.y + y - mTop;
      // Outside the stored mask area the mask continues its nearest edge value.
      const cx = Math.max(0, Math.min(info.width - 1, mx)), cy = Math.max(0, Math.min(info.height - 1, my));
      const mv = m[(cy * info.width + cx) * info.channels] / 255;
      data[(y * img.w + x) * 4 + 3] = Math.round(img.data[(y * img.w + x) * 4 + 3] * mv);
    }
    await webp(sharp(data, { raw: { width: img.w, height: img.h, channels: 4 } }), "veil.webp");
  },

  /** Location card: embossed frame x peach base (multiply, clipped), plus the gold edge and shadow from its layer style. */
  async frame() {
    const pad = 36;
    const L = h.layers.get(87);
    const W = L.width + pad * 2, H = L.height + pad * 2;
    const cv = canvas(W, H, { left: L.x - pad, top: L.y - pad, fill: [0, 0, 0, 0] });
    await drawLayers(h, cv, [87, 88]);
    const alpha = Float32Array.from(cv.a);
    // Gold edge: a crisp ~2px band just outside the paper (dilate, then a hair of feather).
    const grown = await growMask(alpha, W, H, 1.4, 0.6);
    const edge = grown.map((v, i) => Math.max(0, v - alpha[i]));
    // Soft shadow, mostly downwards.
    const shifted = new Float32Array(W * H);
    for (let y = 6; y < H; y++) for (let x = 0; x < W; x++) shifted[y * W + x] = alpha[(y - 6) * W + x];
    const shadow = await blurMask(shifted, W, H, 7);
    const outCv = canvas(W, H, { left: cv.left, top: cv.top, fill: [0, 0, 0, 0] });
    const gold = [0xe9 / 255, 0xa0 / 255, 0x26 / 255];
    const shade = [0x8a / 255, 0x45 / 255, 0x3a / 255];
    for (let i = 0; i < W * H; i++) {
      const sa = shadow[i] * 0.42;
      const ea = Math.min(1, edge[i]);
      const pa = alpha[i];
      // shadow, then gold edge, then paper (source-over)
      let r = shade[0], g = shade[1], b = shade[2], a = sa;
      const over = (cr, cg, cb, ca) => { const na = ca + a * (1 - ca); if (na > 0) { r = (cr * ca + r * a * (1 - ca)) / na; g = (cg * ca + g * a * (1 - ca)) / na; b = (cb * ca + b * a * (1 - ca)) / na; } a = na; };
      over(gold[0], gold[1], gold[2], ea);
      over(cv.rgb[i * 3], cv.rgb[i * 3 + 1], cv.rgb[i * 3 + 2], pa);
      outCv.rgb[i * 3] = r; outCv.rgb[i * 3 + 1] = g; outCv.rgb[i * 3 + 2] = b; outCv.a[i] = a;
    }
    // Colour-fit the paper to the composite where nothing sits on the card.
    const ref = await canvasFromImage(REF3, { left: 0, top: cv.top, width: 720, height: H });
    const block = canvas(720, H, { top: cv.top, fill: [0, 0, 0, 0] });
    const busy = await growMask(await layerAlpha(block, [92, 118, 119, 121, 123]), 720, H, 10, 0);
    const src = canvas(W, H), tgt = canvas(W, H);
    const where = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ax = cv.left + x;
      const i = y * W + x;
      if (ax < 0 || ax >= 720 || alpha[i] < 0.99 || busy[y * 720 + ax] > 0) continue;
      for (let c = 0; c < 3; c++) { src.rgb[i * 3 + c] = outCv.rgb[i * 3 + c]; tgt.rgb[i * 3 + c] = ref.rgb[(y * 720 + ax) * 3 + c]; }
      where[i] = 1;
    }
    const fit = fitAffine(src, tgt, where);
    for (let i = 0; i < W * H; i++) {
      if (alpha[i] <= 0) continue;
      for (let c = 0; c < 3; c++) {
        const fitted = fit[c].g * outCv.rgb[i * 3 + c] + fit[c].o;
        outCv.rgb[i * 3 + c] = outCv.rgb[i * 3 + c] * (1 - alpha[i]) + fitted * alpha[i];
      }
    }
    await webp(toBuffer(outCv), "location-frame.webp");
    console.log(`  frame at x=${cv.left} y=${cv.top} size ${W}x${H}; fit`, fit.map((f) => f.g.toFixed(2)).join(" "));
  },

  /**
   * Silk background behind the order of the day and dress code: burgundy +
   * fabric texture (linear light) + floating pearls (pin light). Rendered
   * 1400px wide so it continues past the column on desktop, then corrected
   * row by row to the composite's gradient (a layer style the export lacks).
   */
  async silk() {
    const left = -340, top = 4396, W = 1400, H = 2504;
    const cv = canvas(W, H, { left, top, fill: [0x5f / 255, 0x01 / 255, 0x0b / 255, 1] });
    // The fabric reads stronger in the saved composite than its exported 10%
    // opacity suggests, and softer: matched by eye at 1:1 (a slight blur and
    // ~80% linear light give its sheen without marbling).
    const fabric = h.layers.get(80);
    const soft = await sharp(layerFile(80)).ensureAlpha().blur(2.5).raw().toBuffer({ resolveWithObject: true });
    await drawLayers(h, cv, [80, 108, 109, 110], { 80: { opacity: 0.8, img: { data: soft.data, w: soft.info.width, h: soft.info.height }, x: fabric.x, y: fabric.y } });
    const ref = await canvasFromImage(REF3, { left: 0, top, width: 720, height: H });
    // Rows: median difference over columns that are mostly background.
    const block = canvas(720, H, { top, fill: [0, 0, 0, 0] });
    const busy = await growMask(await layerAlpha(block, [79, 81, 89, 95, 96, 97, 99, 101, 103, 105, 124, 125, 127, 128, 129, 131, 132, 133, 134, 135, 136, 141, 142, 143, 144, 145, 149]), 720, H, 8, 0);
    const corr = new Float32Array(H * 3);
    for (let y = 0; y < H; y++) {
      for (let c = 0; c < 3; c++) {
        const d = [];
        for (let x = 0; x < 720; x += 3) { if (busy[y * 720 + x] > 0) continue; d.push(ref.rgb[(y * 720 + x) * 3 + c] - cv.rgb[(y * W + (x - left)) * 3 + c]); }
        d.sort((a, b) => a - b);
        corr[y * 3 + c] = d.length > 8 ? d[d.length >> 1] : NaN;
      }
    }
    // Fill gaps, then smooth.
    for (let c = 0; c < 3; c++) {
      let last = 0;
      for (let y = 0; y < H; y++) { if (Number.isNaN(corr[y * 3 + c])) corr[y * 3 + c] = last; else last = corr[y * 3 + c]; }
      const sm = new Float32Array(H);
      const R = 60;
      for (let y = 0; y < H; y++) { let s = 0, n = 0; for (let k = -R; k <= R; k++) { const yy = Math.max(0, Math.min(H - 1, y + k)); s += corr[yy * 3 + c]; n++; } sm[y] = s / n; }
      for (let y = 0; y < H; y++) corr[y * 3 + c] = sm[y];
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) cv.rgb[(y * W + x) * 3 + c] += corr[y * 3 + c];
    await webp(toBuffer(cv, { alpha: false }), "silk.webp", 80);
    const at = (y) => "#" + [0, 1, 2].map((c) => Math.round(Math.max(0, Math.min(1, cv.rgb[(y * W + 700) * 3 + c])) * 255).toString(16).padStart(2, "0")).join("");
    console.log(`  silk ${W}x${H} at x=${left} y=${top}; colour top ${at(0)} mid ${at(H >> 1)} bottom ${at(H - 1)}`);
  },

  /** Ivory paper behind "Our Moments", text- and decoration-free, colour-fitted (its colour fill isn't in the export). */
  async moments() {
    const H = 1100;
    const cv = canvas(720, H, { fill: [0, 0, 0, 1] });
    await drawLayers(h, cv, [153, 154]);
    const ref = await canvasFromImage(REF4, { left: 0, top: 0, width: 720, height: H });
    const block = canvas(720, H, { fill: [0, 0, 0, 0] });
    const busy = await growMask(await layerAlpha(block, [156, 159, 161, 163, 165, 166, 169, 176, 182]), 720, H, 6, 0);
    const fit = fitAffine(cv, ref, Uint8Array.from(busy, (v) => (v > 0 ? 0 : 1)));
    for (let i = 0; i < 720 * H; i++) for (let c = 0; c < 3; c++) cv.rgb[i * 3 + c] = fit[c].g * cv.rgb[i * 3 + c] + fit[c].o;
    await webp(toBuffer(cv, { alpha: false }), "moments-paper.webp", 82);
    console.log("  moments fit", fit.map((f) => `${f.g.toFixed(2)}/${(f.o * 255).toFixed(0)}`).join(" "));
  },

  /**
   * Lace dividers: the composite's lace (its layer style adds a translucent
   * fill and shadow the export lacks), cut out by its silhouette. One 195px
   * period, so CSS can repeat it across any width.
   */
  async lace() {
    const P = 195;
    for (const { id, name, top, x0 } of [
      { id: 85, name: "lace-top", top: 1960, x0: 263 },
      { id: 89, name: "lace-bottom", top: 4266, x0: 263 },
    ]) {
      const H = 210;
      const L = h.layers.get(id);
      const png = await loadRGBA(layerFile(id));
      const ref = await canvasFromImage(REF3, { left: x0, top, width: P, height: H });
      const sil = new Float32Array(P * H);
      for (let x = 0; x < P; x++) {
        const px = x0 + x - L.x;
        let t = -1, b = -1;
        for (let y = 0; y < png.h; y++) if (png.data[(y * png.w + px) * 4 + 3] > 100) { if (t < 0) t = y; b = y; }
        if (t < 0) continue;
        const y0 = L.y + t - top - 2, y1 = L.y + b - top + 3;
        for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) sil[y * P + x] = 1;
      }
      const soft = await blurMask(sil, P, H, 0.7);
      const shifted = new Float32Array(P * H);
      for (let y = 5; y < H; y++) for (let x = 0; x < P; x++) shifted[y * P + x] = sil[(y - 5) * P + x];
      const shadow = await blurMask(shifted, P, H, 5);
      const cv = canvas(P, H, { fill: [0, 0, 0, 0] });
      for (let i = 0; i < P * H; i++) {
        const a = soft[i];
        const sa = Math.max(0, shadow[i] - a) * 0.3;
        const na = a + sa * (1 - a);
        for (let c = 0; c < 3; c++) cv.rgb[i * 3 + c] = na > 0 ? (ref.rgb[i * 3 + c] * a + 0.25 * sa * (1 - a)) / na : 0;
        cv.a[i] = na;
      }
      await webp(toBuffer(cv), `${name}.webp`, 92);
    }
  },

  /** Seamless tile of the ivory net behind the locations (repeats every 55 x 45 px). */
  async mesh() {
    const TW = 110, TH = 90;
    const area = { left: 0, top: 2160, width: 720, height: 2100 };
    const cv = canvas(720, area.height, { top: area.top, fill: [1, 1, 1, 1] });
    await drawLayers(h, cv, [82, 84]);
    const ref = await canvasFromImage(REF3, area);
    const block = canvas(720, area.height, { top: area.top, fill: [0, 0, 0, 0] });
    const busy = await growMask(await layerAlpha(block, [86, 87, 89, 90]), 720, area.height, 10, 0);
    const fit = fitAffine(cv, ref, Uint8Array.from(busy, (v) => (v > 0 ? 0 : 1)));
    const sx = 300, sy = 2700 - area.top;
    const at = (x, y, c) => fit[c].g * cv.rgb[((sy + y) * 720 + sx + x) * 3 + c] + fit[c].o;
    // Blend each pixel with its copy one period ahead, weighted so that the
    // tile's last column flows into its first (and likewise for rows).
    const tile = canvas(TW, TH);
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const u = x / TW, v = y / TH;
      for (let c = 0; c < 3; c++) {
        const p00 = at(x, y, c), p10 = at(x + TW, y, c), p01 = at(x, y + TH, c), p11 = at(x + TW, y + TH, c);
        tile.rgb[(y * TW + x) * 3 + c] = v * (u * p00 + (1 - u) * p10) + (1 - v) * (u * p01 + (1 - u) * p11);
      }
    }
    await webp(toBuffer(tile, { alpha: false }), "mesh-tile.webp", 88);
    console.log("  mesh fit", fit.map((f) => `${f.g.toFixed(2)}/${(f.o * 255).toFixed(0)}`).join(" "));
  },

  /**
   * Analysis only: traces the PSD's hand-drawn timeline (a thin gold stroke in
   * the composite) and prints its points. The theme rebuilds the line from
   * the dot positions (sections/Programme.tsx); this is how they were checked.
   */
  async timeline() {
    const top = 5063, bottom = 6341;
    const ref = await canvasFromImage(REF3, { left: 0, top, width: 720, height: bottom - top });
    // The stroke is ~1px of gold on burgundy: green channel ~0.2-0.6. Labels
    // and icons are much lighter (> 0.7), so they're ignored while tracking.
    const line = (x, y) => {
      const g = ref.rgb[(y * 720 + x) * 3 + 1];
      return g > 0.16 && g < 0.7 ? g : 0;
    };
    // Sub-pixel centre of the stroke near `x` on row `y`, or null.
    const centre = (x, y, reach) => {
      let s = 0, w = 0;
      for (let dx = -reach; dx <= reach; dx++) { const v = line(Math.round(x) + dx, y); s += v * (Math.round(x) + dx); w += v; }
      return w > 0.12 ? s / w : null;
    };
    let x = 382, slope = -1.2; // starts beside the arch icon, heading down-left
    const raw = [];
    for (let y = 0; y < bottom - top; y++) {
      const c = centre(x + slope, y, 4);
      if (c !== null) { slope = slope * 0.7 + (c - x) * 0.3; x = c; } else x += slope;
      raw.push(x);
    }
    // Light smoothing, then sample every 6 rows.
    const pts = [];
    for (let y = 0; y < raw.length; y += 6) {
      let s = 0, n = 0;
      for (let k = -6; k <= 6; k++) { const v = raw[y + k]; if (v !== undefined) { s += v; n++; } }
      pts.push([+(s / n).toFixed(1), top + y]);
    }
    pts.push([+raw[raw.length - 1].toFixed(1), bottom]);
    console.log("  timeline (x@y):", pts.filter((_, i) => i % 10 === 0).map(([x, y]) => `${x}@${y}`).join(" "));
  },
};

const wanted = process.argv.slice(2);
for (const [name, run] of Object.entries(steps)) {
  if (wanted.length && !wanted.includes(name)) continue;
  const t = Date.now();
  await run();
  console.log(`✓ ${name} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
}
