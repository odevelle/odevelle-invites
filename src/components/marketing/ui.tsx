import type { ReactNode } from "react";
import { Ornament } from "./icons";

/** Small uppercase section label, e.g. "N°1 · ✦ · The Collection". */
export function Eyebrow({
  number,
  children,
  className = "",
}: {
  number?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`m-0 flex items-center gap-3 text-[13px] font-medium uppercase tracking-[.22em] text-olive ${className}`}
    >
      {number}
      <Ornament />
      {children}
    </p>
  );
}

/** Shared look of section headlines: Cormorant, gold, with an olive italic accent. */
export const displayHeading =
  "font-serif font-medium leading-[1.04] tracking-[-0.01em] text-gold [&_em]:text-olive";

type ButtonVariant = "primary" | "ghost" | "light" | "line" | "outline";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-olive text-white hover:bg-olive-deep hover:text-white",
  ghost: "border border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-cream",
  light: "bg-butter text-ink hover:bg-butter-deep hover:text-ink",
  line: "border border-cream/50 text-cream hover:bg-cream/12",
  outline: "border-[1.5px] border-olive text-olive hover:bg-olive hover:text-white",
};

const displayClass = /(^|\s)(flex|hidden|block|grid|inline-block)(\s|$)/;

/**
 * Pill button classes. Size (height, padding, type) is set by the caller.
 * Defaults to inline-flex unless `extra` sets its own display (e.g. "hidden lg:inline-flex").
 */
export function button(variant: ButtonVariant, extra = "") {
  const display = displayClass.test(extra) ? "" : "inline-flex";
  return `btn ${display} items-center justify-center rounded-full no-underline ${variants[variant]} ${extra}`;
}
