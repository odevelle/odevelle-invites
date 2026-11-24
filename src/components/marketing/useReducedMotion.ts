"use client";

import { useMediaQuery } from "./useMediaQuery";

/** Whether this visitor asked their system for reduced motion. */
export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
