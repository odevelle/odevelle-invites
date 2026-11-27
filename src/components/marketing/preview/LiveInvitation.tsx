"use client";

import { useEffect, useRef, useState } from "react";

/** The phone the invitation is laid out for, then scaled to fit the preview. */
const SCREEN = { width: 390, height: 844 };

/**
 * A real, working invitation (the demo at /sites/{slug}) inside a phone
 * frame: rendered at a phone's width and scaled down, so it looks exactly as
 * guests see it, and the visitor can tap the seal and scroll through it.
 */
export function LiveInvitation({ slug, title }: { slug: string; title: string }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / SCREEN.width);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative w-full rounded-[14%/6.5%] p-[3%] shadow-[inset_0_0_0_1.5px_#4A3F42,0_34px_60px_-26px_rgba(31,36,32,.55),0_14px_26px_-16px_rgba(31,36,32,.4)]"
      style={{ background: "linear-gradient(150deg, #3A3134 0%, #141012 38%, #0B0809 62%, #2A2326 100%)" }}
    >
      <div
        ref={screenRef}
        className="relative w-full overflow-hidden rounded-[11.5%/5.3%] bg-[#1e0104]"
        style={{ aspectRatio: `${SCREEN.width} / ${SCREEN.height}` }}
      >
        {scale > 0 && (
          <iframe
            src={`/sites/${slug}`}
            title={title}
            className="absolute top-0 left-0 origin-top-left border-0"
            style={{ width: SCREEN.width, height: SCREEN.height, transform: `scale(${scale})` }}
          />
        )}
      </div>
    </div>
  );
}
