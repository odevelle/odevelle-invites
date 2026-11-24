"use client";

import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { ChevronLeft, ChevronRight } from "./icons";
import { COMPACT_SCREEN, useMediaQuery } from "./useMediaQuery";
import { useReducedMotion } from "./useReducedMotion";

/** Where to put the row, and where to glide it, once a new order has rendered. */
type Move = { to: number; glide: number };

const arrow =
  "btn flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-olive/35 bg-transparent text-olive hover:bg-olive hover:text-white";

/**
 * A horizontal snap row that walks forward for ever.
 *
 * A step glides on by one card. Once that has settled, the card that just left
 * is moved to the end of the row and the scroll is put back by the same
 * distance — the two cancel out exactly, so nothing is seen to move. The row
 * therefore never reaches an end and never has to rewind.
 *
 * Rest is always scroll position zero. Every step begins and ends there: any
 * scroll left behind by the visitor, or by a glide the browser cut short, is
 * folded into the order instead of being left to pile up.
 *
 * It steps on its own only for the screen sizes it is given an interval for,
 * and only while the row overflows. It holds while the visitor is touching,
 * hovering or tabbing through it, while the tab is in the background, and
 * whenever reduced motion is asked for; the arrows hand over control for good.
 */
export function LoopingRow({
  interval,
  compactInterval = interval,
  itemLabel = "card",
  className,
  children,
  ...rest
}: {
  /** Step every this many ms. Leave it out to keep the row still. */
  interval?: number;
  /** The same, below the `lg` breakpoint. Defaults to `interval`. */
  compactInterval?: number;
  /** Names the arrows, e.g. "design" → "Show the next design". */
  itemLabel?: string;
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const move = useRef<Move | null>(null);
  /** Brings the step that is under way to its resting state, there and then. */
  const finish = useRef<(() => void) | null>(null);
  const [order, setOrder] = useState(0);
  const [steered, setSteered] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  const cards = Children.toArray(children);
  const count = cards.length;
  const every = useMediaQuery(COMPACT_SCREEN) ? compactInterval : interval;
  const reduced = useReducedMotion();

  /** Distance from one card to the next, gap included. */
  const stride = useCallback(() => {
    const first = ref.current?.firstElementChild;
    const second = first?.nextElementSibling;
    return first && second
      ? second.getBoundingClientRect().left - first.getBoundingClientRect().left
      : 0;
  }, []);

  const rotate = useCallback(
    (by: number, next: Move) => {
      if (!by) return;
      move.current = next;
      setOrder((o) => (((o + by) % count) + count) % count);
    },
    [count],
  );

  // Runs before the browser paints the re-ordered row, so the swap and the
  // scroll that cancels it land in the same frame and are never seen.
  useLayoutEffect(() => {
    const el = ref.current;
    const m = move.current;
    if (!el || !m) return;
    move.current = null;
    el.scrollLeft = m.to;
    if (m.glide) el.scrollTo({ left: m.to + m.glide, behavior: "smooth" });
  }, [order]);

  /**
   * Run `then` once the row has stopped moving — or the moment another step
   * asks for it, so a glide is never read while it is still in flight.
   */
  const onceSettled = useCallback((el: HTMLDivElement, then: () => void) => {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      el.removeEventListener("scrollend", run);
      window.clearTimeout(backstop);
      if (finish.current === run) finish.current = null;
      then();
    };
    // `scrollend` is not everywhere yet, so time the glide out as well.
    const backstop = window.setTimeout(run, 900);
    el.addEventListener("scrollend", run);
    finish.current = run;
  }, []);

  const forward = useCallback(() => {
    finish.current?.(); // Land the step under way before reading the scroll.
    const el = ref.current;
    const max = el ? el.scrollWidth - el.clientWidth : 0;
    const by = stride();
    if (!el || max <= 1 || by <= 0) return;
    const span = Math.min(by, max);

    const ahead = Math.min(Math.round(el.scrollLeft / by), count - 1);
    if (ahead >= 1) {
      // Scroll the visitor left behind: make it part of the order, then carry on.
      rotate(ahead, { to: 0, glide: span });
    } else {
      el.scrollLeft = 0; // Discard any sliver a cut-short glide left.
      el.scrollTo({ left: span, behavior: "smooth" });
    }

    onceSettled(el, () => {
      const unit = stride();
      if (unit <= 0) return;
      // Half a card or more counts as a step; anything less falls back to rest.
      if (el.scrollLeft >= unit / 2) rotate(1, { to: 0, glide: 0 });
      else el.scrollLeft = 0;
    });
  }, [count, onceSettled, rotate, stride]);

  const backward = useCallback(() => {
    finish.current?.(); // Land the step under way before reading the scroll.
    const el = ref.current;
    const max = el ? el.scrollWidth - el.clientWidth : 0;
    const by = stride();
    if (!el || max <= 1 || by <= 0) return;
    // Bring the last card round to the front, hold the view still, then glide
    // back onto it — the mirror of a forward step.
    const span = Math.min(by, max);
    rotate(-1, { to: span, glide: -span });
    onceSettled(el, () => {
      el.scrollLeft = 0; // Where the glide was headed.
    });
  }, [onceSettled, rotate, stride]);

  const steer = (go: () => void) => {
    setSteered(true); // The visitor is driving now.
    go();
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScrollable(el.scrollWidth - el.clientWidth > 1));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !every || reduced || steered || count < 2) return;

    let held = false;
    const hold = () => {
      held = true;
    };
    const release = () => {
      held = false;
    };

    const timer = window.setInterval(() => {
      if (held || document.visibilityState !== "visible") return;
      forward();
    }, every);

    const events = [
      ["pointerenter", hold],
      ["pointerleave", release],
      ["pointerdown", hold],
      ["pointerup", release],
      ["pointercancel", release],
      ["focusin", hold],
      ["focusout", release],
    ] as const;
    for (const [name, fn] of events) el.addEventListener(name, fn);

    return () => {
      window.clearInterval(timer);
      for (const [name, fn] of events) el.removeEventListener(name, fn);
    };
  }, [count, every, forward, reduced, steered]);

  return (
    <>
      <div ref={ref} className={className} {...rest}>
        {order ? [...cards.slice(order), ...cards.slice(0, order)] : cards}
      </div>
      {scrollable && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => steer(backward)}
            aria-label={`Show the previous ${itemLabel}`}
            className={arrow}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => steer(forward)}
            aria-label={`Show the next ${itemLabel}`}
            className={arrow}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}
