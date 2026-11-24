"use client";

import { useEffect } from "react";

/**
 * Makes a link to the section you are already on do something.
 *
 * Clicking a link whose URL already matches the address bar is a no-op: the
 * browser has nowhere new to go, so nothing scrolls. Someone who opened
 * /#designs, read on down the page and then pressed "Explore Designs" again
 * found a dead button. The same went for every nav link.
 *
 * This watches for exactly that case — same page, same hash, a section that
 * really is there — and scrolls to it. Every other link is left alone, so
 * ordinary navigation still belongs to Next.js and the browser.
 *
 * It listens on the way down: `next/link` cancels the click on the anchor
 * itself, so by the time one bubbles back up there is nothing left to read.
 * The click is not stopped, only cancelled, so handlers on the link still run
 * — the mobile menu still closes on its way out.
 */
export function SameSectionScroll() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank") return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== window.location.pathname) return;
      if (!url.hash || url.hash !== window.location.hash) return; // A real navigation will do it.

      const section = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!section) return;

      event.preventDefault();
      // After paint, so a menu closing on the same click has let go of the
      // body scroll first. Smooth or instant follows `scroll-behavior`, which
      // already answers to reduced motion.
      requestAnimationFrame(() => section.scrollIntoView({ block: "start" }));
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
