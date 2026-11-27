import Image from "next/image";
import type { CSSProperties } from "react";
import type { Asset } from "./assets";

/*
 * Layout in PSD units. The design is a 720px-wide artboard; `--rl2-u` is one
 * PSD pixel (viewport / 720 on phones, exactly 1px from 720px up), so every
 * position and size below is the number read off the PSD.
 *
 * Sections are full-bleed; their content sits in a centred 720u column and
 * decoration may spill past it, which wide screens then show in full.
 */

/** A length of `n` PSD pixels. */
export const u = (n: number) => `calc(${n} * var(--rl2-u))`;

/** next/image `sizes` for something `w` PSD pixels wide. */
export const sizesFor = (w: number) => `(min-width: 720px) ${Math.round(w)}px, ${(w / 7.2).toFixed(2)}vw`;

/** Absolute box in PSD units, relative to the section column. */
export function box(x: number, y: number, w?: number, h?: number): CSSProperties {
  return { position: "absolute", left: u(x), top: u(y), ...(w !== undefined && { width: u(w) }), ...(h !== undefined && { height: u(h) }) };
}

/** A text box centred on `cx`, `w` wide. */
export const centred = (cx: number, y: number, w: number): CSSProperties => box(cx - w / 2, y, w);

type DataAttrs = { [key: `data-${string}`]: string | number | boolean | undefined };

type ArtProps = DataAttrs & {
  asset: Asset;
  /** Position relative to the section origin, in PSD units (defaults to the asset's own). */
  x?: number;
  y: number;
  className?: string;
  style?: CSSProperties;
  alt?: string;
  eager?: boolean;
};

/** A decorative PSD layer, positioned and sized in PSD units. */
export function Art({ asset, x = asset.x, y, className, style, alt = "", eager, ...rest }: ArtProps) {
  return (
    <Image
      src={asset.src}
      width={asset.w}
      height={asset.h}
      alt={alt}
      sizes={sizesFor(asset.w)}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      className={`rl2-art${className ? ` ${className}` : ""}`}
      style={{ ...box(x, y, asset.w), ...style }}
      {...rest}
    />
  );
}

/** Delay for staggered reveals. */
export const delay = (ms: number): CSSProperties => ({ "--rl2-d": `${ms}ms` }) as CSSProperties;

/**
 * The PSD's ampersand (its script font's glyph, which no open font matches),
 * drawn as a mask in the current text colour. The real "&" stays in the text
 * for screen readers and copy/paste.
 */
export function Amp({ className, style, ...rest }: { className?: string; style?: CSSProperties } & DataAttrs) {
  return (
    <span className={`rl2-amp${className ? ` ${className}` : ""}`} style={style} {...rest}>
      <span className="rl2-sr">&amp;</span>
    </span>
  );
}
