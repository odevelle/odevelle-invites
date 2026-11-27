"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { centred } from "./psd";

/*
 * Days / hours / minutes / seconds, as in the PSD. Ticks once a second, and
 * only while the countdown is on screen. Shows dashes until hydrated: the page
 * is cached, so only the browser knows "now".
 */

const UNITS = [
  { key: "days", label: "Days", cx: 194 },
  { key: "hours", label: "Hours", cx: 313.5 },
  { key: "minutes", label: "Minutes", cx: 423 },
  { key: "seconds", label: "Seconds", cx: 536.5 },
] as const;

export function CountdownClock({ target, top }: { target: string; top: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const now = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const subscribe = useCallback((onChange: () => void) => {
    const tick = () => {
      now.current = Math.floor(Date.now() / 1000);
      onChange();
    };
    tick();
    const id = window.setInterval(() => visible.current && !document.hidden && tick(), 1000);
    return () => window.clearInterval(id);
  }, []);

  const seconds = useSyncExternalStore(subscribe, () => now.current, () => null);
  const left = seconds === null ? null : Math.max(0, Math.floor(Date.parse(target) / 1000) - seconds);
  const parts =
    left === null
      ? null
      : { days: Math.floor(left / 86400), hours: Math.floor((left % 86400) / 3600), minutes: Math.floor((left % 3600) / 60), seconds: left % 60 };

  return (
    <div ref={ref} role="timer" aria-live="off" data-countdown-ready={parts ? "true" : "false"} className="rl2-countdown" data-reveal-group>
      {UNITS.map((unit, i) => {
        const value = parts?.[unit.key];
        const text = value === undefined ? "—" : unit.key === "days" ? String(value) : String(value).padStart(2, "0");
        return (
          <div key={unit.key} className="rl2-countdown__unit" data-reveal="rise" style={{ ...centred(unit.cx, top, 150), "--rl2-d": `${240 + i * 110}ms` } as CSSProperties}>
            <span className="rl2-countdown__value">{text}</span>
            <span className="rl2-countdown__label">{unit.label}</span>
          </div>
        );
      })}
    </div>
  );
}
