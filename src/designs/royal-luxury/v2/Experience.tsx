"use client";

import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { IntroductionScreen, type IntroductionProps } from "./intro/IntroductionScreen";

/*
 * The client shell around the (server-rendered) invitation:
 *  - the envelope intro overlay, if the invitation uses it;
 *  - scroll reveals: one IntersectionObserver marks `[data-reveal]` elements
 *    and `[data-reveal-group]` containers as shown; CSS does the animating;
 *  - background music, started by the tap that opens the envelope.
 *
 * While the intro covers the page, the invitation behind it is inert; once it
 * opens, focus moves to the names so keyboard and screen reader users land at
 * the start of the invitation.
 */

export function Experience({
  intro,
  audio,
  children,
}: {
  intro?: IntroductionProps;
  audio?: { src: string; type: string };
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [revealed, setRevealed] = useState(!intro);
  const [music, setMusic] = useState<"off" | "on" | "paused">("off");

  useReveal(rootRef, revealed);

  const startMusic = useCallback(() => {
    audioRef.current
      ?.play()
      .then(() => setMusic("on"))
      .catch(() => setMusic("paused"));
  }, []);

  const toggleMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().then(() => setMusic("on")).catch(() => {});
    else {
      a.pause();
      setMusic("paused");
    }
  }, []);

  const focusNames = useRef(false);
  const reveal = useCallback(() => {
    // Only move focus if it was on the intro (the button that's about to go).
    focusNames.current = !document.activeElement || document.activeElement === document.body || !!document.activeElement.closest(".rl2-intro");
    setRevealed(true);
  }, []);

  // After the re-render that lifts `inert`, so the heading can take focus.
  useEffect(() => {
    if (!revealed || !focusNames.current) return;
    focusNames.current = false;
    const heading = rootRef.current?.querySelector<HTMLElement>("main h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [revealed]);

  return (
    <div ref={rootRef} className="rl2-experience" data-revealed={revealed ? "" : undefined}>
      <div inert={!revealed}>{children}</div>
      {intro && <IntroductionScreen {...intro} onOpen={startMusic} onReveal={reveal} />}
      {audio && (
        <div data-section="music">
          <audio ref={audioRef} preload="none" loop onPause={() => setMusic("paused")} onPlay={() => setMusic("on")}>
            <source src={audio.src} type={audio.type} />
          </audio>
          <button
            type="button"
            className="rl2-music"
            onClick={music === "off" ? startMusic : toggleMusic}
            aria-pressed={music === "on"}
            aria-label={music === "on" ? "Pause music" : "Play music"}
            data-state={music}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 18.5a2.5 2.5 0 1 1-2.5-2.5c.9 0 1.7.5 2.1 1.2V5.6l10-2.1v12.9a2.5 2.5 0 1 1-2.5-2.5c.9 0 1.7.5 2.1 1.2V7.2L9 8.7z" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Marks reveal targets as shown when they scroll into view. Standalone
 * `[data-reveal]` elements trigger on their own; inside a
 * `[data-reveal-group]` the group triggers and children stagger via CSS.
 */
function useReveal(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal-group], [data-reveal]:not([data-reveal-group] [data-reveal])");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -9% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [rootRef, enabled]);
}
