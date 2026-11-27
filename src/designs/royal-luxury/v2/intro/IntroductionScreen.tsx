"use client";

import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import type { Asset } from "../assets";

/*
 * The opening: the envelope video, paused on its first frame (a small poster
 * image; no video data is fetched yet). Intent to tap (hover, focus, touch)
 * starts buffering; a tap breaks the seal with a burst of pearl light and plays
 * the envelope opening. As the flaps part, shimmering pearl light fills the
 * opening (the video's plain white paper is never seen): the video is cut
 * there, the glow flares, and the overlay dissolves into the invitation
 * rendered underneath.
 *
 * Reduced motion: the tap skips the video and fades straight in.
 */

type Phase = "idle" | "opening" | "leaving" | "gone";

export type IntroductionProps = {
  videoSrc: string;
  poster: Asset;
  seal: { x: number; y: number };
  /** Who the invitation is from, for the accessible label. */
  hostsLine: string;
};

type Props = IntroductionProps & {
  /** Called inside the tap (a user gesture), e.g. to start music. */
  onOpen: () => void;
  /** Called when the overlay starts fading out. */
  onReveal: () => void;
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Video time at which we cut to the invitation: the flaps have parted and the frame is all pearl light. */
const CUT_AT = 3.1;
/** The flaps begin to part (white paper would show) just after this; the pearl is full by PEARL_FULL. */
const PEARL_FROM = 1.15;
const PEARL_FULL = 1.6;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const FADE_MS = 1300;

export function IntroductionScreen({ videoSrc, poster, seal, hostsLine, onOpen, onReveal }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);

  // Start at the top, whatever the browser restored.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    setPhase("leaving");
    onReveal();
    window.setTimeout(() => setPhase("gone"), FADE_MS);
  }, [onReveal]);

  /** Buffer on intent, so playback starts promptly on tap without loading video for visitors who never open it. */
  const warm = useCallback(() => {
    const v = videoRef.current;
    // Reduced motion never plays the video, so never fetch it.
    if (v && v.preload !== "auto" && !prefersReducedMotion()) {
      v.preload = "auto";
      v.load();
    }
  }, []);

  const open = useCallback(() => {
    if (phase !== "idle") return;
    onOpen();
    setPhase("opening");
    const v = videoRef.current;
    if (!v || prefersReducedMotion()) {
      window.setTimeout(leave, 350);
      return;
    }
    warm();
    v.play().catch(leave);
  }, [phase, onOpen, warm, leave]);

  // Pearl light, locked to the video's own clock (not wall time), so no white
  // paper can show even if playback stutters. Runs only while the video plays.
  useEffect(() => {
    if (phase !== "opening") return;
    const v = videoRef.current;
    const stage = stageRef.current;
    if (!v || !stage) return;
    let raf = 0;
    let vfc = 0;
    const paint = () => {
      const t = v.currentTime;
      stage.style.setProperty("--pearl", String(clamp01((t - PEARL_FROM) / (PEARL_FULL - PEARL_FROM))));
      stage.style.setProperty("--glow", String(clamp01((t - PEARL_FROM - 0.1) / (CUT_AT - PEARL_FROM - 0.1))));
    };
    const onFrame = () => {
      paint();
      vfc = v.requestVideoFrameCallback(onFrame);
    };
    const onRaf = () => {
      paint();
      raf = requestAnimationFrame(onRaf);
    };
    if ("requestVideoFrameCallback" in v) vfc = v.requestVideoFrameCallback(onFrame);
    else raf = requestAnimationFrame(onRaf);
    return () => {
      if (vfc) v.cancelVideoFrameCallback(vfc);
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  // Fade out as the envelope finishes; never strand the guest if the video stalls.
  useEffect(() => {
    if (phase !== "opening") return;
    const v = videoRef.current;
    if (!v) return;
    const check = () => {
      if (v.currentTime >= CUT_AT) leave();
    };
    const safety = window.setTimeout(leave, 10_000);
    v.addEventListener("timeupdate", check);
    v.addEventListener("ended", leave);
    v.addEventListener("error", leave);
    return () => {
      window.clearTimeout(safety);
      v.removeEventListener("timeupdate", check);
      v.removeEventListener("ended", leave);
      v.removeEventListener("error", leave);
    };
  }, [phase, leave]);

  if (phase === "gone") return null;

  const sealStyle = { "--seal-x": seal.x, "--seal-y": seal.y } as CSSProperties;

  return (
    <div className="rl2-intro" data-phase={phase} style={sealStyle}>
      <div ref={stageRef} className="rl2-intro__stage">
        <Image
          src={poster.src}
          width={poster.w}
          height={poster.h}
          alt=""
          fetchPriority="high"
          loading="eager"
          sizes="(orientation: portrait) 100vw, 57vh"
          className="rl2-intro__media"
        />
        <video
          ref={videoRef}
          className="rl2-intro__media rl2-intro__video"
          data-playing={playing ? "" : undefined}
          src={videoSrc}
          width={poster.w}
          height={poster.h}
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
        />
        {/* Pearl light in the opening (driven by --pearl / --glow from the video clock). */}
        <span aria-hidden="true" className="rl2-intro__pearl" />
        <span aria-hidden="true" className="rl2-intro__flare" />
        <span aria-hidden="true" className="rl2-intro__nacre" />
        <span aria-hidden="true" className="rl2-intro__dust" />
        <span aria-hidden="true" className="rl2-intro__glint" />
        <span aria-hidden="true" className="rl2-intro__wash" />
        <span aria-hidden="true" className="rl2-intro__halo" />
        <span aria-hidden="true" className="rl2-intro__bloom" />
        <button
          type="button"
          className="rl2-intro__tap"
          onClick={open}
          onPointerEnter={warm}
          onPointerDown={warm}
          onFocus={warm}
          disabled={phase !== "idle"}
          aria-label={`Open the invitation from ${hostsLine}`}
        >
          <span aria-hidden="true" className="rl2-intro__hint">
            Tap the seal to open
          </span>
        </button>
        {phase === "opening" && (
          <button type="button" className="rl2-intro__skip" onClick={leave}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
