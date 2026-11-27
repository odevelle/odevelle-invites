"use client";

import { useSyncExternalStore } from "react";

export type CountdownParts = { days: number; hours: number; minutes: number; passed: boolean };

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

/**
 * Time left until `targetIso`, refreshed every 30 seconds. Logic only: each
 * theme renders its own countdown markup.
 *
 * Returns null on the server and during hydration (the page is cached, so the
 * server can't know "now"); themes show a placeholder until it fills in.
 */
export function useCountdown(targetIso: string | undefined): CountdownParts | null {
  // Minute resolution keeps the snapshot stable between ticks.
  const nowMinute = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  if (!targetIso || nowMinute === null) return null;

  const diff = Date.parse(targetIso) - nowMinute * 60_000;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, passed: true };
  const minutes = Math.floor(diff / 60_000);
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60, passed: false };
}
