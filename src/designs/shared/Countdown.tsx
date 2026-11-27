"use client";

import { useCountdown } from "./useCountdown";

type Classes = { root?: string; item?: string; value?: string; label?: string };

/**
 * Days / hours / minutes until `target`. Themes style it with class names;
 * a theme that needs different markup can call `useCountdown` directly.
 * Shows dashes until hydrated (the page itself is cached, so "now" is only
 * known in the browser).
 */
export function Countdown({ target, classNames = {} }: { target: string; classNames?: Classes }) {
  const parts = useCountdown(target);
  const items: [string, number | undefined][] = [
    ["days", parts?.days],
    ["hours", parts?.hours],
    ["minutes", parts?.minutes],
  ];
  return (
    <div className={classNames.root} role="timer" aria-live="off" data-countdown-ready={parts ? "true" : "false"}>
      {items.map(([label, value]) => (
        <div key={label} className={classNames.item}>
          <span className={classNames.value}>{value === undefined ? "—" : String(value).padStart(2, "0")}</span>
          <span className={classNames.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
