"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Narrow screens: phones and tablets, everything below the `lg` breakpoint,
 * where the carousels show fewer cards at once and so step through faster.
 */
export const COMPACT_SCREEN = "(max-width: 959.98px)";

/**
 * Whether a media query matches right now.
 *
 * The page is prerendered, so the server snapshot says no; the real answer is
 * read after hydration and kept up to date if the viewport changes.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
