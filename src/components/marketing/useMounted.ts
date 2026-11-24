"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * False while prerendering and during hydration, true once on the client.
 *
 * Used to hold a browser-only widget back until after hydration, so the
 * prerender stays free of per-render values and the page remains static.
 */
export function useMounted() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
