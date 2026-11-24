import type { CSSProperties } from "react";
import { designById, type DesignId } from "@/content/marketing/designs";

/*
 * Illustrated invitation mockups used across the marketing page (hero phones,
 * collection cards, preview sheet). These are marketing artwork only and are
 * intentionally separate from the real tenant invitation themes.
 *
 * All artwork scales with its container (container-query `cqw` units), so a
 * mockup renders identically at any width.
 */

type Frame = "phone" | "paper";

export function InviteMockup({ design, frame = "phone" }: { design: DesignId; frame?: Frame }) {
  const phone = frame === "phone";

  return (
    <div
      role="img"
      aria-label={designById[design].label}
      className="@container relative w-full font-manrope"
      style={{
        aspectRatio: "300 / 624",
        borderRadius: phone ? "14% / 6.73%" : "1.6% / .8%",
        background: phone
          ? "linear-gradient(150deg, #3A3134 0%, #141012 38%, #0B0809 62%, #2A2326 100%)"
          : "#FFFFFF",
        boxShadow: phone
          ? "inset 0 0 0 1.5px #4A3F42, 0 34px 60px -26px rgba(31,36,32,.55), 0 14px 26px -16px rgba(31,36,32,.4)"
          : "0 24px 40px -18px rgba(31,36,32,.45), 0 6px 14px -8px rgba(31,36,32,.25)",
      }}
    >
      {phone && (
        <>
          <span aria-hidden="true" className="absolute rounded-xs bg-[#1E1719]" style={{ left: "-1%", top: "19%", width: "1.4%", height: "6%" }} />
          <span aria-hidden="true" className="absolute rounded-xs bg-[#1E1719]" style={{ left: "-1%", top: "28%", width: "1.4%", height: "9%" }} />
          <span aria-hidden="true" className="absolute rounded-xs bg-[#1E1719]" style={{ right: "-1%", top: "24%", width: "1.4%", height: "12%" }} />
        </>
      )}

      <div
        aria-hidden="true"
        className="absolute overflow-hidden bg-[#FBF6EF]"
        style={{
          top: phone ? "1.45%" : 0,
          bottom: phone ? "1.45%" : 0,
          left: phone ? "3%" : 0,
          right: phone ? "3%" : 0,
          borderRadius: phone ? "11.4cqw" : "1.6% / .8%",
        }}
      >
        {design === "royal" && <RoyalLace />}
        {design === "azulejo" && <Azulejo />}
        {design === "garden" && <EmbroideredGarden />}
        {design === "shore" && <PearlShore />}

        {phone && (
          <>
            {/* Dynamic island + glass sheen */}
            <span
              className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#050304]"
              style={{ top: "2.8cqw", width: "29cqw", height: "8.4cqw" }}
            />
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: "11.4cqw",
                background: "linear-gradient(115deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 32%)",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- shared */

const pearlStrand = (size: string, mid = "#F4ECDF", edge = "#CDBB9F"): string =>
  `radial-gradient(circle at 40% 35%, #FFFFFF 0, ${mid} 30%, ${edge} 52%, transparent 56%) 0 50% / ${size} ${size} repeat-x`;

const layer = (style: CSSProperties) => <div className="absolute inset-x-0" style={style} />;

const textBlock = "rise absolute flex flex-col items-center text-center [&_p]:m-0";

/* ------------------------------------------------------------ Royal Lace */

function RoyalLace() {
  const dots = "radial-gradient(circle, #EBDDC9 .45cqw, transparent .55cqw) 1.5cqw 2cqw / 3cqw 3cqw, #FFFDF8";
  return (
    <div
      className="absolute inset-0"
      style={{ background: "radial-gradient(120% 70% at 50% 42%, #FBF4EA 0%, #F1E3D0 70%, #E8D5BE 100%)" }}
    >
      {layer({ top: 0, height: "10cqw", background: dots })}
      {layer({
        top: "10cqw",
        height: "2.2cqw",
        background: "radial-gradient(circle at 50% 0, #FFFDF8 2cqw, transparent 2.1cqw) 0 0 / 4cqw 4cqw repeat-x",
      })}
      {layer({ top: "14cqw", height: "4cqw", background: pearlStrand("4cqw") })}
      {layer({ bottom: 0, height: "10cqw", background: dots })}
      {layer({
        bottom: "10cqw",
        height: "2.2cqw",
        background: "radial-gradient(circle at 50% 100%, #FFFDF8 2cqw, transparent 2.1cqw) 0 100% / 4cqw 4cqw repeat-x",
      })}
      {layer({ bottom: "14cqw", height: "4cqw", background: pearlStrand("4cqw") })}

      <div className={textBlock} style={{ left: "10%", right: "10%", top: "17%" }}>
        <svg width="16%" viewBox="0 0 40 24" fill="none">
          <path d="M4 20L8 7l8 7 4-11 4 11 8-7 4 13z" stroke="#9B1B30" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M4 20h32" stroke="#9B1B30" strokeWidth="1.1" />
          <circle cx="8" cy="6" r="1.5" fill="#9B1B30" />
          <circle cx="20" cy="2.4" r="1.5" fill="#9B1B30" />
          <circle cx="32" cy="6" r="1.5" fill="#9B1B30" />
        </svg>
        <p className="uppercase tracking-[.22em] text-[#7A5A5F]" style={{ marginTop: "4cqw", fontSize: "3cqw" }}>
          Together with their families
        </p>
        <p className="font-vibes leading-none text-[#9B1B30]" style={{ marginTop: "3cqw", fontSize: "15cqw" }}>
          Charlotte
        </p>
        <p className="font-bodoni italic leading-[1.1] text-[#A8344F]" style={{ fontSize: "6cqw" }}>
          &amp;
        </p>
        <p className="font-vibes leading-none text-[#9B1B30]" style={{ fontSize: "15cqw" }}>
          Henry
        </p>
        <p className="font-bodoni italic leading-[1.35] text-[#6B4A4F]" style={{ marginTop: "4cqw", fontSize: "4.2cqw" }}>
          request the honour of your presence
        </p>
        <span className="block" style={{ width: "30cqw", height: "3cqw", margin: "3.5cqw 0", background: pearlStrand("3cqw") }} />
        <p className="font-bodoni tracking-[.08em] text-[#2B0D14]" style={{ fontSize: "6cqw" }}>
          12 · 06 · 2027
        </p>
        <p className="uppercase tracking-[.14em] text-[#7A5A5F]" style={{ marginTop: "1.5cqw", fontSize: "3.2cqw" }}>
          The Grand Ballroom · Bath
        </p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Azulejo */

const TILE = (() => {
  const t = "0 0 / 12.5cqw 12.5cqw";
  const blue = "#2F5DA8";
  return [
    `radial-gradient(circle at 50% 50%, #E8B83A 0 1.5cqw, transparent 1.6cqw) ${t}`,
    `radial-gradient(circle at 50% 25%, ${blue} 0 2.3cqw, transparent 2.4cqw) ${t}`,
    `radial-gradient(circle at 75% 50%, ${blue} 0 2.3cqw, transparent 2.4cqw) ${t}`,
    `radial-gradient(circle at 50% 75%, ${blue} 0 2.3cqw, transparent 2.4cqw) ${t}`,
    `radial-gradient(circle at 25% 50%, ${blue} 0 2.3cqw, transparent 2.4cqw) ${t}`,
    `radial-gradient(circle at 0 0, ${blue} 0 2.2cqw, transparent 2.3cqw) ${t}`,
    `radial-gradient(circle at 100% 0, ${blue} 0 2.2cqw, transparent 2.3cqw) ${t}`,
    `radial-gradient(circle at 0 100%, ${blue} 0 2.2cqw, transparent 2.3cqw) ${t}`,
    `radial-gradient(circle at 100% 100%, ${blue} 0 2.2cqw, transparent 2.3cqw) ${t}`,
    `linear-gradient(90deg, #C9D6EC .25cqw, transparent .25cqw) ${t}`,
    `linear-gradient(0deg, #C9D6EC .25cqw, transparent .25cqw) ${t}`,
    "#FFFFFF",
  ].join(", ");
})();

const BEADS =
  "radial-gradient(circle, #2F5DA8 0 .7cqw, transparent .8cqw) 0 50% / 4cqw 100% repeat-x, radial-gradient(circle, #E8B83A 0 .55cqw, transparent .65cqw) 2cqw 50% / 4cqw 100% repeat-x";

function Azulejo() {
  return (
    <div className="absolute inset-0 bg-[#FBF8F1]">
      {layer({ top: 0, height: "25cqw", background: TILE })}
      {layer({ top: "25cqw", height: ".9cqw", background: "#E8B83A" })}
      {layer({ top: "27.5cqw", height: "3cqw", background: BEADS })}
      {layer({ bottom: 0, height: "25cqw", background: TILE })}
      {layer({ bottom: "25cqw", height: ".9cqw", background: "#E8B83A" })}
      {layer({ bottom: "26.5cqw", height: "3cqw", background: BEADS })}

      <div className={textBlock} style={{ left: "10%", right: "10%", top: "25%" }}>
        <p className="font-bodoni italic leading-[1.3] text-[#2F5DA8]" style={{ fontSize: "4.4cqw" }}>
          Many waters cannot quench love
        </p>
        <p className="uppercase tracking-[.22em] text-[#5B6A8A]" style={{ marginTop: "1.4cqw", fontSize: "2.8cqw" }}>
          Song of Solomon 8:7
        </p>
        <p className="font-bodoni leading-none text-[#1F3F7A]" style={{ marginTop: "6cqw", fontSize: "12.5cqw" }}>
          Inês
        </p>
        <p className="font-vibes leading-none text-[#C9971F]" style={{ margin: ".6cqw 0", fontSize: "9cqw" }}>
          &amp;
        </p>
        <p className="font-bodoni leading-none text-[#1F3F7A]" style={{ fontSize: "12.5cqw" }}>
          Tomás
        </p>
        <p className="font-bodoni tracking-[.12em] text-[#1F2A44]" style={{ marginTop: "5cqw", fontSize: "5.6cqw" }}>
          21 · 01 · 2028
        </p>
        <p className="uppercase tracking-[.16em] text-[#5B6A8A]" style={{ marginTop: "1.4cqw", fontSize: "3.2cqw" }}>
          Chapel ceremony · Goa
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Embroidered Garden */

const PETALS: [number, number][] = [
  [0, -3.4],
  [3.2, -1.1],
  [2, 2.8],
  [-2, 2.8],
  [-3.2, -1.1],
];
const stitch = { strokeDasharray: "1.2 .8" };

function Garland({ flip }: { flip?: boolean }) {
  // Top garland arcs upwards; the bottom one is its mirror image.
  const y = (v: number) => (flip ? 430 - v : v);
  const r = (deg: number) => (flip ? -deg : deg);
  const leaves: [number, number, number][] = [
    [52, 68, -35],
    [70, 60, -15],
    [130, 60, 15],
    [148, 68, 35],
    [88, 56, -5],
    [112, 56, 5],
  ];
  const flowers: [number, number][] = [
    [62, 63],
    [100, 54],
    [138, 63],
  ];
  const beads: [number, number][] = [
    [78, 52],
    [122, 52],
    [46, 74],
    [154, 74],
    [90, 66],
    [110, 66],
  ];
  return (
    <g>
      <path
        d={flip ? "M40 352 C70 378 130 378 160 352" : "M40 78 C70 52 130 52 160 78"}
        stroke="#6F8460"
        strokeWidth=".8"
        strokeDasharray="2.2 1.4"
        fill="none"
      />
      {leaves.map(([cx, cy, deg]) => (
        <ellipse
          key={`l${cx}`}
          cx={cx}
          cy={y(cy)}
          rx="6"
          ry="2.4"
          fill="#8FA27E"
          stroke="#5E7250"
          strokeWidth=".5"
          {...stitch}
          transform={`rotate(${r(deg)} ${cx} ${y(cy)})`}
        />
      ))}
      {flowers.map(([cx, cy]) => {
        // Petal offsets are not symmetric vertically, so the mirrored flower keeps them unflipped.
        const fy = flip ? y(cy) : cy;
        return (
          <g key={`f${cx}`}>
            {PETALS.map(([dx, dy], i) => (
              <circle
                key={i}
                cx={cx + dx}
                cy={fy + dy}
                r="3"
                fill="#FFFFFF"
                stroke="#6F8460"
                strokeWidth=".6"
                {...stitch}
              />
            ))}
            <circle cx={cx} cy={fy} r="1.7" fill="#E3C77A" />
          </g>
        );
      })}
      {beads.map(([cx, cy]) => (
        <circle key={`b${cx}${cy}`} cx={cx} cy={y(cy)} r="1.1" fill="#D9CBA4" />
      ))}
    </g>
  );
}

function EmbroideredGarden() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(111,132,96,.06) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(111,132,96,.06) 0 1px, transparent 1px 3px), #F8F6EE",
      }}
    >
      <svg viewBox="0 0 200 430" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" fill="none">
        <rect x="9" y="9" width="182" height="412" rx="10" stroke="#8FA27E" strokeWidth=".9" strokeDasharray="3 2.2" />
        <Garland />
        <Garland flip />
      </svg>

      <div className={textBlock} style={{ left: "12%", right: "12%", top: "26%" }}>
        <p className="font-bodoni italic text-[#6F8460]" style={{ fontSize: "4.8cqw" }}>
          Our wedding day
        </p>
        <p className="font-vibes leading-none text-[#3F5236]" style={{ marginTop: "5cqw", fontSize: "15cqw" }}>
          Élise
        </p>
        <p className="font-bodoni italic leading-none text-[#6F8460]" style={{ margin: ".5cqw 0", fontSize: "5.4cqw" }}>
          &amp;
        </p>
        <p className="font-vibes leading-none text-[#3F5236]" style={{ fontSize: "15cqw" }}>
          Julien
        </p>
        <span className="block h-0 border-t border-dashed border-[#8FA27E]" style={{ width: "24cqw", margin: "5cqw 0 4cqw" }} />
        <p className="tracking-[.24em] text-[#2F3B2A]" style={{ fontSize: "4cqw" }}>
          05 · 05 · 2027
        </p>
        <p className="font-bodoni italic text-[#5B6356]" style={{ marginTop: "1.6cqw", fontSize: "4.2cqw" }}>
          Garden ceremony · Provence
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- Pearl Shore */

function PearlShore() {
  const pearl = (
    <span
      className="rounded-full"
      style={{
        width: "3.2cqw",
        height: "3.2cqw",
        background: "radial-gradient(circle at 35% 30%, #FFFFFF, #EFE6DA 55%, #C9B9A3)",
      }}
    />
  );
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle, rgba(184,152,102,.22) .3cqw, transparent .36cqw) 0 0 / 3.2cqw 3.2cqw, linear-gradient(180deg, #FBF3E4 0%, #F3E6CF 100%)",
      }}
    >
      <div className={textBlock} style={{ left: "10%", right: "10%", top: "11%" }}>
        <div className="flex items-center" style={{ gap: "2cqw" }}>
          {pearl}
          <svg viewBox="0 0 40 36" fill="none" style={{ width: "18cqw" }}>
            <path d="M20 33L4 14Q20-5 36 14Z" fill="#F7E7DA" stroke="#C99A86" strokeWidth=".9" strokeLinejoin="round" />
            <path d="M20 33L8.5 9.5M20 33L13.5 5.5M20 33V3.5M20 33L26.5 5.5M20 33L31.5 9.5" stroke="#C99A86" strokeWidth=".7" />
            <path d="M16.5 33h7l-1 2.6h-5z" fill="#E9CDBD" stroke="#C99A86" strokeWidth=".7" />
          </svg>
          {pearl}
        </div>
        <p className="uppercase tracking-[.32em] text-[#3E7B7D]" style={{ marginTop: "5cqw", fontSize: "3.2cqw" }}>
          Save the date
        </p>
        <p className="font-bodoni italic leading-none text-[#1F4E52]" style={{ marginTop: "4cqw", fontSize: "13cqw" }}>
          Chiara
        </p>
        <p className="font-vibes leading-none text-[#B67E52]" style={{ margin: ".6cqw 0", fontSize: "9cqw" }}>
          &amp;
        </p>
        <p className="font-bodoni italic leading-none text-[#1F4E52]" style={{ fontSize: "13cqw" }}>
          Lorenzo
        </p>
        <p className="font-bodoni tracking-[.12em] text-[#2B3A3B]" style={{ marginTop: "5cqw", fontSize: "5.6cqw" }}>
          18 · 09 · 2027
        </p>
        <p className="uppercase tracking-[.16em] text-[#3E7B7D]" style={{ marginTop: "1.4cqw", fontSize: "3.2cqw" }}>
          Beach ceremony · Amalfi
        </p>
      </div>

      {layer({ bottom: "27%", height: "3.4cqw", background: pearlStrand("3.4cqw", "#F2EADF", "#CBBBA5") })}

      <svg viewBox="0 0 200 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 h-[26%] w-full">
        <path d="M0 22C30 8 60 36 100 22S170 8 200 22V120H0Z" fill="#CBE5E1" />
        <path d="M0 22C30 8 60 36 100 22S170 8 200 22" stroke="#FFFFFF" strokeWidth="1.6" fill="none" opacity=".85" />
        <path d="M0 52C35 38 65 66 100 52S165 38 200 52V120H0Z" fill="#94C6C2" />
        <path d="M0 52C35 38 65 66 100 52S165 38 200 52" stroke="#FFFFFF" strokeWidth="1.2" fill="none" opacity=".6" />
        <path d="M0 84C35 72 65 96 100 84S165 72 200 84V120H0Z" fill="#5E9E9E" />
      </svg>
    </div>
  );
}
