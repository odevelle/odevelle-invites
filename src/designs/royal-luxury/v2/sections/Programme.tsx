import type { CSSProperties, ReactNode } from "react";
import type { Artwork, Asset, IconKey } from "../assets";
import type { Moment } from "../model";
import { Art, box, centred, delay, u } from "../psd";

/*
 * Order of the day + dress code (artboard 03, y 4400–7142) on burgundy silk.
 *
 * The PSD's timeline is a hand-drawn gold line swinging between five dots.
 * Here the dots keep the PSD's positions and the line is rebuilt as an SVG
 * path through them (vertical tangents at each dot, like the original), so it
 * extends to any number of moments and can draw itself as you scroll.
 */

const ORDER_TOP = 4400;
const DRESS_TOP = 6440;

/** Dot centres from the PSD, relative to the section; later moments continue the rhythm. */
const PSD_DOTS: readonly [number, number][] = [
  [268.5, 5188.5 - ORDER_TOP],
  [457.5, 5476 - ORDER_TOP],
  [305, 5767 - ORDER_TOP],
  [432.5, 6058.5 - ORDER_TOP],
  [354.5, 6338.5 - ORDER_TOP],
];
const LINE_START: [number, number] = [379, 5063 - ORDER_TOP];

function dotsFor(count: number): [number, number][] {
  const dots = PSD_DOTS.slice(0, count).map((d) => [...d] as [number, number]);
  for (let i = dots.length; i < count; i++) dots.push([i % 2 === 0 ? 305 : 432.5, dots[i - 1][1] + 288]);
  return dots;
}

function linePath(dots: [number, number][]): string {
  const [x0, y0] = LINE_START;
  const [x1, y1] = dots[0];
  let d = `M${x0} ${y0} C${x0 - 49} ${y0 + 27} ${x1} ${y1 - 48} ${x1} ${y1}`;
  for (let i = 1; i < dots.length; i++) {
    const [ax, ay] = dots[i - 1];
    const [bx, by] = dots[i];
    const k = (by - ay) * 0.55;
    d += ` C${ax} ${ay + k} ${bx} ${by - k} ${bx} ${by}`;
  }
  return d;
}

/** Icon centre offsets from its dot, measured on the PSD (dx is mirrored to the free side). */
const ICON_OFFSET: Record<IconKey, { dx: number; dy: number }> = {
  arch: { dx: 107, dy: -10 },
  rings: { dx: 114, dy: -21 },
  champagne: { dx: 95, dy: 0 },
  cake: { dx: 99, dy: -7 },
  dance: { dx: 120, dy: -69 },
};

export function Silk({ children, art }: { children: ReactNode; art: Artwork }) {
  return (
    <div className="rl2-silk">
      <div aria-hidden="true" className="rl2-silk__col">
        <Art asset={art.a3.silk} y={art.a3.silk.y - ORDER_TOP} className="rl2-silk__texture" />
      </div>
      {children}
    </div>
  );
}

export function OrderOfTheDay({ items, showTimes, art }: { items: Moment[]; showTimes: boolean; art: Artwork }) {
  const dots = dotsFor(items.length);
  const height = dots[dots.length - 1][1] + 102;
  // The velvet florals hang where the PSD's five-moment day has room for them.
  const velvetRight = height > art.a3.velvetRight.y - ORDER_TOP + art.a3.velvetRight.h - 100;
  const velvetLeft = height > art.a3.velvetLeft.y - ORDER_TOP + art.a3.velvetLeft.h - 120;
  return (
    <section data-section="timeline" className="rl2-section rl2-order" aria-labelledby="rl2-order-title">
      <div className="rl2-col" style={{ height: u(height) }}>
        <Art asset={art.a3.strands} y={art.a3.strands.y - ORDER_TOP} data-reveal="fade" className="rl2-order__strands" />
        <div className="rl2-sway" style={box(art.a3.chandelier.x, art.a3.chandelier.y - ORDER_TOP, art.a3.chandelier.w, art.a3.chandelier.h)}>
          <Art asset={art.a3.chandelier} x={0} y={0} data-reveal="descend" className="rl2-order__chandelier" />
        </div>
        {velvetRight && (
          <div className="rl2-drift rl2-drift--slow" style={box(0, 0, 720, height)}>
            <Art asset={art.a3.velvetRight} y={art.a3.velvetRight.y - ORDER_TOP} data-reveal="from-right" className="rl2-order__velvet" />
          </div>
        )}
        {velvetLeft && (
          <div className="rl2-drift" style={box(0, 0, 720, height)}>
            <Art asset={art.a3.velvetLeft} y={art.a3.velvetLeft.y - ORDER_TOP} data-reveal="from-left" className="rl2-order__velvet" />
          </div>
        )}

        <div className="rl2-fill" data-reveal-group>
          <h2 id="rl2-order-title" className="rl2-script rl2-cream-warm rl2-order__title" data-reveal="write" style={centred(360, 4759 - ORDER_TOP, 680)}>
            Order of the Day
          </h2>
          <p className="rl2-serif rl2-cream-warm rl2-caps rl2-order__subtitle" data-reveal="rise" style={{ ...centred(360, 4881 - ORDER_TOP, 560), ...delay(500) }}>
            What we have planned
          </p>
        </div>

        <svg className="rl2-order__line" aria-hidden="true" viewBox={`0 0 720 ${height}`} style={box(0, 0, 720, height)} data-reveal="line">
          <path d={linePath(dots)} pathLength={1} />
        </svg>

        <ol className="rl2-order__list">
          {items.map((item, i) => (
            <TimelineItem key={item.id} item={item} icon={art.icons[item.icon]} dot={dots[i]} first={i === 0} labelRight={i % 2 === 0} showTime={showTimes} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function TimelineItem({ item, icon, dot, first, labelRight, showTime }: { item: Moment; icon: Asset; dot: [number, number]; first: boolean; labelRight: boolean; showTime: boolean }) {
  const [dx, dy] = dot;
  // The first moment's icon sits above its label (as the arch does in the PSD); later ones face their label across the line.
  const iconCentre = first
    ? { x: labelRight ? 379 + icon.w / 2 : 377 - icon.w / 2, y: dy - 134 }
    : { x: dx + (labelRight ? -1 : 1) * ICON_OFFSET[item.icon].dx, y: dy + ICON_OFFSET[item.icon].dy };
  // 296u: wide enough for "COCKTAIL HOUR" on one line, narrow enough to wrap like the PSD.
  const labelStyle: CSSProperties = labelRight ? box(378, dy, 296) : box(377 - 296, dy, 296);
  return (
    <li className="rl2-moment" data-reveal-group>
      <span aria-hidden="true" className="rl2-moment__dot" data-reveal="pop" style={centred(dx, dy - 10.5, 21)} />
      <Art asset={icon} x={iconCentre.x - icon.w / 2} y={iconCentre.y - icon.h / 2} data-reveal="rise" style={delay(200)} className="rl2-moment__icon" />
      <p className={`rl2-serif rl2-cream-warm rl2-caps rl2-moment__label rl2-moment__label--${labelRight ? "right" : "left"}`} style={labelStyle}>
        <span data-reveal={labelRight ? "from-right" : "from-left"} style={delay(120)} className="rl2-moment__text">
          {showTime && <time className="rl2-moment__time">{item.time}</time>}
          {item.title}
        </span>
      </p>
    </li>
  );
}

/** Without a dress code, the silk still ends on the ivory hill, as in the PSD. */
export function SilkEnd() {
  return (
    <div aria-hidden="true" className="rl2-section rl2-dress">
      <div className="rl2-dress__floor" style={{ top: u(637 - 300) }} />
      <div className="rl2-col" style={{ height: u(7142 - DRESS_TOP - 300) }}>
        <div className="rl2-dress__hill" style={{ marginTop: u(-300) }} />
      </div>
    </div>
  );
}

export function DressCode({ code, note, art }: { code: string; note?: string; art: Artwork }) {
  return (
    <section data-section="dress-code" className="rl2-section rl2-dress" aria-labelledby="rl2-dress-title">
      <div aria-hidden="true" className="rl2-dress__floor" />
      <div className="rl2-col" style={{ height: u(7142 - DRESS_TOP) }}>
        <div aria-hidden="true" className="rl2-dress__hill" />
        <div className="rl2-fill" data-reveal-group>
          <h2 id="rl2-dress-title" className="rl2-script rl2-cream-warm rl2-dress__title" data-reveal="write" style={centred(360, 6485 - DRESS_TOP, 560)}>
            Dress Code
          </h2>
          <p className="rl2-serif rl2-cream-warm rl2-caps rl2-dress__code" data-reveal="rise" style={{ ...centred(360, 6585 - DRESS_TOP, 600), ...delay(450) }}>
            {code}
          </p>
          <Art asset={art.a3.couple} y={art.a3.couple.y - DRESS_TOP} data-reveal="rise-slow" style={delay(650)} className="rl2-dress__couple" />
          {note && (
            <p className="rl2-serif rl2-ink rl2-dress__note" data-reveal="rise" style={{ ...centred(360, 7090 - DRESS_TOP, 640), ...delay(900) }}>
              {note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
