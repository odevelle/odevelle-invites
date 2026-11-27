/*
 * Turns a short decorative video shot on a flat background (no alpha) into
 * transparent "time slices" that CSS can replay over any background.
 *
 * Why not key every frame: white pearls on cream can't be separated per frame
 * (highlights match the background colour), and per-frame mattes flicker.
 * Instead:
 *  1. one clean matte from the finished last frame (highlights filled, the
 *     drop shadow split out as a darkening layer);
 *  2. for every frame, how far each pixel has travelled from background to
 *     its final colour (the reveal), and how much brighter it is than final
 *     (the glint);
 *  3. pixels grouped by when they appear / glint into a few slices, each a
 *     small transparent image cropped to its area, with its start time.
 */
import { createReadStream, statSync } from "node:fs";
import http from "node:http";
import sharp from "sharp";

/** Decodes every frame (WebKit plays H.264 natively; no ffmpeg needed). */
export async function extractFrames(file, { fps, count, width, height }) {
  const { webkit } = await import("playwright");
  const size = statSync(file).size;
  const server = http.createServer((req, res) => {
    if (req.url === "/") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(`<body style="margin:0"><video id="v" src="/v.mp4" muted playsinline preload="auto" style="display:block;width:${width}px;height:${height}px"></video></body>`);
    }
    const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range ?? "");
    const start = range ? Number(range[1]) : 0;
    const end = range && range[2] ? Number(range[2]) : size - 1;
    res.writeHead(range ? 206 : 200, { "content-type": "video/mp4", "accept-ranges": "bytes", "content-length": end - start + 1, ...(range ? { "content-range": `bytes ${start}-${end}/${size}` } : {}) });
    createReadStream(file, { start, end }).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));
  const browser = await webkit.launch();
  const frames = [];
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`http://localhost:${server.address().port}/`);
    await page.waitForFunction(() => document.querySelector("video").readyState >= 2);
    for (let i = 0; i < count; i++) {
      await page.evaluate((t) => new Promise((r) => { const v = document.querySelector("video"); v.onseeked = () => requestAnimationFrame(() => requestAnimationFrame(r)); v.currentTime = t; }), (i + 0.5) / fps);
      const png = await page.locator("video").screenshot();
      frames.push(Float32Array.from(await sharp(png).removeAlpha().raw().toBuffer(), (v) => v / 255));
    }
  } finally {
    await browser.close();
    server.close();
  }
  return frames;
}

function blur(field, W, H, sigma) {
  const r = Math.ceil(sigma * 3), k = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k.push(v); sum += v; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let j = -r; j <= r; j++) s += field[y * W + Math.min(W - 1, Math.max(0, x + j))] * k[j + r]; tmp[y * W + x] = s; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let j = -r; j <= r; j++) s += tmp[Math.min(H - 1, Math.max(0, y + j)) * W + x] * k[j + r]; out[y * W + x] = s; }
  return out;
}

const lum = (a, i) => 0.3 * a[i * 3] + 0.59 * a[i * 3 + 1] + 0.11 * a[i * 3 + 2];

/**
 * @param frames   decoded frames (Float32 RGB, 0..1)
 * @param options  { W, H, fps, revealSlices, glintSlices, glintColour: [r,g,b] 0..255, shadowStrength }
 * @returns { crop: {x, y, w, h}, pearls: {x0,y0,x1,y1}, layers: [{ kind, data, w, h, x, y, at }] }
 */
export function sliceKeyedAnimation(frames, { W, H, fps, revealSlices = 14, glintSlices = 8, glintColour = [255, 214, 140], shadowStrength = 0.6 }) {
  const N = W * H;
  const last = frames[frames.length - 1];
  // Background: the first frames, before anything is drawn.
  const B = new Float32Array(N * 3);
  for (const f of frames.slice(0, 3)) for (let k = 0; k < N * 3; k++) B[k] += f[k] / 3;

  // 1. Matte from the finished frame.
  const seed = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const d = Math.hypot(last[i * 3] - B[i * 3], last[i * 3 + 1] - B[i * 3 + 1], last[i * 3 + 2] - B[i * 3 + 2]);
    const L = lum(last, i), Lb = lum(B, i);
    const warmth = (last[i * 3] - last[i * 3 + 2]) * 255; // shadow is warm; pearls are neutral
    if (d > 0.035 && (L > Lb + 0.012 || warmth < 13 || L < 0.74)) seed[i] = 1;
  }
  // Fill small enclosed holes (highlights) but never the frame's open interior.
  const filled = Uint8Array.from(seed), seen = new Uint8Array(N), stack = [];
  for (let s = 0; s < N; s++) {
    if (seed[s] || seen[s]) continue;
    const comp = [];
    stack.push(s);
    seen[s] = 1;
    while (stack.length) {
      const p = stack.pop();
      comp.push(p);
      const x = p % W, y = (p / W) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) if (q >= 0 && !seed[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
    }
    if (comp.length < 140) for (const p of comp) filled[p] = 1;
  }
  const soft = blur(Float32Array.from(filled), W, H, 0.75);
  const m = soft.map((v) => Math.min(1, v * 1.25));
  const P = new Float32Array(N * 3), S = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    for (let c = 0; c < 3; c++) P[i * 3 + c] = m[i] > 0.04 ? Math.max(0, Math.min(1, (last[i * 3 + c] - (1 - m[i]) * B[i * 3 + c]) / m[i])) : 0;
    const Lb = lum(B, i);
    S[i] = (1 - m[i]) * Math.max(0, Math.min(1, ((Lb - lum(last, i)) / Lb) * 2));
  }

  // 2. Per pixel: when it is drawn, and when/how strongly the glint passes.
  const denRaw = new Float32Array(N);
  for (let i = 0; i < N; i++) { let s = 0; for (let c = 0; c < 3; c++) { const d = last[i * 3 + c] - B[i * 3 + c]; s += d * d; } denRaw[i] = s; }
  const den = blur(denRaw, W, H, 2.5);
  const tRev = new Int16Array(N).fill(-1), gPeak = new Int16Array(N), gAmp = new Float32Array(N), revealed = new Float32Array(N);
  frames.forEach((C, f) => {
    const num = new Float32Array(N), gain = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let s = 0;
      for (let c = 0; c < 3; c++) s += (C[i * 3 + c] - B[i * 3 + c]) * (last[i * 3 + c] - B[i * 3 + c]);
      num[i] = Math.max(0, s);
      gain[i] = (C[i * 3] + C[i * 3 + 1] + C[i * 3 + 2] - last[i * 3] - last[i * 3 + 1] - last[i * 3 + 2]) / 3;
    }
    const nb = blur(num, W, H, 2.5), gb = blur(gain, W, H, 1.5);
    for (let i = 0; i < N; i++) {
      let r = den[i] > 2e-4 ? Math.min(1, nb[i] / den[i]) : 0;
      r = Math.max(r, revealed[i]); // drawn pearls stay drawn
      revealed[i] = r;
      if (r >= 0.5 && tRev[i] < 0) tRev[i] = f;
      const g = gb[i] - 0.03; // above compression noise
      if (r > 0.94 && g > gAmp[i]) { gAmp[i] = g; gPeak[i] = f; }
    }
  });

  // Final RGBA (pearls over their shadow) and the crop around it.
  const rgba = new Uint8ClampedArray(N * 4);
  let x0 = W, y0 = H, x1 = 0, y1 = 0, px0 = W, py0 = H, px1 = 0, py1 = 0;
  for (let i = 0; i < N; i++) {
    const ap = m[i], as = shadowStrength * S[i], a = ap + as * (1 - ap);
    for (let c = 0; c < 3; c++) rgba[i * 4 + c] = a > 0 ? ((P[i * 3 + c] * ap) / a) * 255 : 0;
    rgba[i * 4 + 3] = a * 255;
    const x = i % W, y = (i / W) | 0;
    if (rgba[i * 4 + 3] > 4) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (m[i] > 0.5) { px0 = Math.min(px0, x); px1 = Math.max(px1, x); py0 = Math.min(py0, y); py1 = Math.max(py1, y); }
  }

  // 3. Slices. Each image is resampled on its own when scaled, so where two
  // slices meet, both edges go half-transparent and the background shows as a
  // hairline. Slices therefore overlap by a few pixels wherever the pearl is
  // opaque (opaque over opaque is invisible); soft pixels don't overlap, so
  // shadows aren't darkened twice.
  const BLEED = 3;
  const layers = [];
  const slice = (kind, k, at, own, pixel, bleed) => {
    const core = new Uint8Array(N);
    let ink = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (own(y * W + x)) { core[y * W + x] = 1; ink++; }
    if (ink < 60) return; // stray noise
    const take = Uint8Array.from(core);
    if (bleed) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      if (core[i] || rgba[i * 4 + 3] < 230) continue;
      search: for (let dy = -BLEED; dy <= BLEED; dy++) for (let dx = -BLEED; dx <= BLEED; dx++) { const j = (y + dy) * W + (x + dx); if (y + dy >= 0 && y + dy < H && x + dx >= 0 && x + dx < W && core[j]) { take[i] = 1; break search; } }
    }
    let bx0 = W, by0 = H, bx1 = -1, by1 = -1;
    for (let i = 0; i < N; i++) if (take[i]) { const x = i % W, y = (i / W) | 0; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    const w = bx1 - bx0 + 1, h = by1 - by0 + 1, data = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y + by0) * W + (x + bx0); if (take[i]) pixel(i, data, (y * w + x) * 4); }
    layers.push({ kind, k, data, w, h, x: bx0, y: by0, at: +at.toFixed(2) });
  };
  let tmin = Infinity, tmax = 0;
  for (let i = 0; i < N; i++) if (rgba[i * 4 + 3] > 4 && tRev[i] >= 0) { tmin = Math.min(tmin, tRev[i]); tmax = Math.max(tmax, tRev[i]); }
  const span = (tmax - tmin + 1) / revealSlices;
  for (let k = 0; k < revealSlices; k++) {
    const lo = tmin + k * span, hi = lo + span;
    slice("reveal", k, lo / fps, (i) => { if (rgba[i * 4 + 3] === 0) return false; const t = tRev[i] < 0 ? tmax : tRev[i]; return t >= lo && (t < hi || k === revealSlices - 1); }, (i, d, o) => { d[o] = rgba[i * 4]; d[o + 1] = rgba[i * 4 + 1]; d[o + 2] = rgba[i * 4 + 2]; d[o + 3] = rgba[i * 4 + 3]; }, true);
  }
  let gmin = Infinity, gmax = 0;
  for (let i = 0; i < N; i++) if (gAmp[i] > 0.02) { gmin = Math.min(gmin, gPeak[i]); gmax = Math.max(gmax, gPeak[i]); }
  if (gmax >= gmin) {
    const gspan = (gmax - gmin + 1) / glintSlices;
    for (let k = 0; k < glintSlices; k++) {
      const lo = gmin + k * gspan, hi = lo + gspan;
      slice("glint", k, (lo + hi) / 2 / fps, (i) => gAmp[i] > 0.02 && gPeak[i] >= lo && gPeak[i] < hi, (i, d, o) => { d[o] = glintColour[0]; d[o + 1] = glintColour[1]; d[o + 2] = glintColour[2]; d[o + 3] = Math.min(255, gAmp[i] * 2.4 * 255); }, false);
    }
  }
  return { crop: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }, pearls: { x0: px0, y0: py0, x1: px1, y1: py1 }, layers };
}
