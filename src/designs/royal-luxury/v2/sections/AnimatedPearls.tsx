import type { CSSProperties } from "react";
import { pearlLayers } from "../pearls.generated";
import { box } from "../psd";

/*
 * The countdown's pearl frame, replaying the designer's animation
 * (pearls_animated.mp4): the strand draws itself from the top centre round to
 * the bottom, then a gold glint travels along it, and returns every few
 * seconds. Each slice fades or pulses at its moment in the video (CSS only;
 * started by the reveal observer when the countdown comes into view).
 *
 * Without JS or with reduced motion, the finished frame simply shows.
 */
export function AnimatedPearls({ top, base }: { top: number; base: string }) {
  return (
    <div aria-hidden="true" className="rl2-pearls" data-reveal-group>
      {pearlLayers.map((l) => (
        <span
          key={l.file}
          className={`rl2-pearls__${l.kind}`}
          style={{ ...box(l.x, l.y - top, l.w, l.h), backgroundImage: `url(${base}/${l.file})`, "--at": `${l.at}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}
