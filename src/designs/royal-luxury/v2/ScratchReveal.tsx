"use client";

import Image from "next/image";
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { box, sizesFor } from "./psd";

/*
 * "Scratch to reveal" inside the oval frame. The cover is painted from the
 * frame's own grey opening plus the PSD's lettering, so before scratching it
 * looks exactly like the design. Scratching erases it (destination-out);
 * past half cleared, the rest dissolves. Keyboard and screen reader users get
 * a reveal button. With several gallery photos, they then cross-fade.
 */

type Photo = { src: string; alt: string; width?: number; height?: number };

type Props = {
  /** Plain URL of the frame artwork (painted into the canvas). */
  frameSrc: string;
  frame: { x: number; y: number };
  opening: { cx: number; cy: number; rx: number; ry: number };
  photos: Photo[];
  /** Shown when there are no photos: the date, beneath the names. */
  fallback: { names: string; date?: string };
  fontFamily: string;
};

type State = "covered" | "ready" | "revealing" | "revealed";

const REVEAL_AT = 0.5;
const CYCLE_MS = 4500;

export function ScratchReveal({ frameSrc, frame, opening, photos, fallback, fontFamily }: Props) {
  const { cx, cy, rx, ry } = opening;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>("covered");
  const [index, setIndex] = useState(0);
  const strokes = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);

  // Paint the cover at the canvas's device size; repaint on resize until scratching starts.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    let cancelled = false;
    const img = new window.Image();
    img.decoding = "async";
    img.src = frameSrc;

    const paint = async () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || strokes.current > 0) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const k = canvas.width / (2 * rx); // canvas px per PSD px
      await Promise.all([img.decode().catch(() => {}), document.fonts.load(`${35.5 * k}px ${fontFamily}`).catch(() => {})]);
      if (cancelled) return;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#ebebec";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (img.naturalWidth) ctx.drawImage(img, cx - rx - frame.x, cy - ry - frame.y, 2 * rx, 2 * ry, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#c0c0c0";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `400 ${35.5 * k}px ${fontFamily}`;
      ctx.fillText("SCRATCH TO", canvas.width / 2 - 10 * k, canvas.height / 2 - 6 * k);
      ctx.fillText("REVEAL", canvas.width / 2 - 10 * k, canvas.height / 2 + 38 * k);
      ctx.restore();
      setState((s) => (s === "covered" ? "ready" : s));
    };

    void paint();
    const ro = new ResizeObserver(() => void paint());
    ro.observe(wrap);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [frameSrc, frame.x, frame.y, cx, cy, rx, ry, fontFamily]);

  const reveal = useCallback(() => {
    setState((s) => (s === "revealed" ? s : "revealing"));
    window.setTimeout(() => setState("revealed"), 1100);
  }, []);

  // Cross-fade through the gallery once revealed.
  useEffect(() => {
    if (state !== "revealed" || photos.length < 2) return;
    const id = window.setInterval(() => !document.hidden && setIndex((i) => (i + 1) % photos.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [state, photos.length]);

  const point = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };

  const scratch = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const brush = (canvas.width / (2 * rx)) * 34;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brush;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x + 0.01, to.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    if (++strokes.current % 10 === 0 && cleared(canvas) > REVEAL_AT) reveal();
  };

  const interactive = state === "ready";

  return (
    <div ref={wrapRef} className="rl2-scratch" data-state={state} style={box(cx - rx, cy - ry, 2 * rx, 2 * ry)}>
      <div className="rl2-scratch__reveal" aria-hidden={state === "covered" || state === "ready"}>
        {photos.length > 0 ? (
          photos.map((p, i) => (
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              fill
              sizes={sizesFor(2 * rx)}
              className="rl2-scratch__photo"
              data-active={i === index ? "" : undefined}
            />
          ))
        ) : (
          <div className="rl2-scratch__fallback">
            <span className="rl2-script rl2-scratch__names">{fallback.names}</span>
            {fallback.date && <span className="rl2-serif rl2-scratch__date">{fallback.date}</span>}
          </div>
        )}
      </div>
      {state !== "revealed" && (
        <>
          <p className="rl2-serif rl2-scratch__label" aria-hidden="true">
            Scratch to
            <br />
            reveal
          </p>
          <canvas
            ref={canvasRef}
            className="rl2-scratch__cover"
            aria-hidden="true"
            onPointerDown={(e) => {
              if (!interactive) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              last.current = point(e);
              scratch(last.current, last.current);
            }}
            onPointerMove={(e) => {
              if (!interactive || !last.current) return;
              const p = point(e);
              scratch(last.current, p);
              last.current = p;
            }}
            onPointerUp={() => (last.current = null)}
            onPointerCancel={() => (last.current = null)}
          />
          <button type="button" className="rl2-scratch__key" onClick={reveal} disabled={state === "revealing"}>
            {photos.length > 0 ? "Reveal the photo" : "Reveal the date"}
          </button>
        </>
      )}
    </div>
  );
}

/** Fraction of the oval that has been scratched away (coarse sample). */
function cleared(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  const { width: w, height: h } = canvas;
  const data = ctx.getImageData(0, 0, w, h).data;
  let inside = 0;
  let clear = 0;
  const step = Math.max(4, Math.round(w / 40));
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const nx = (x - w / 2) / (w / 2);
      const ny = (y - h / 2) / (h / 2);
      if (nx * nx + ny * ny > 0.85) continue;
      inside++;
      if (data[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] < 40) clear++;
    }
  }
  return inside ? clear / inside : 0;
}
