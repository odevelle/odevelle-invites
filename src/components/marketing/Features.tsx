import Link from "next/link";
import type { ReactNode } from "react";
import { ctaLinks } from "@/content/marketing/navigation";
import { LinkIcon, Sparkle } from "./icons";
import { transitionTypesFor } from "./PageTransition";
import { button, displayHeading } from "./ui";

/*
 * Bento grid: 1 column → 2 columns (600px) → 4 columns (960px).
 *  wide  = spans 2 columns from 600px
 *  tall  = spans 2 columns from 600px, and 2 rows from 960px
 *  full  = spans the whole row from 600px
 */
type Span = "single" | "wide" | "tall" | "full";
const spanClass: Record<Span, string> = {
  single: "",
  wide: "sm:col-span-2",
  tall: "sm:col-span-2 lg:row-span-2",
  full: "sm:col-span-2 lg:col-span-4",
};

const tile = "reveal rounded-3xl border border-linen bg-white";
const tileTitle = "m-0 font-serif font-semibold leading-[1.15]";
const smallTitle = `${tileTitle} text-2xl text-gold`;
const largeTitle = `${tileTitle} text-[28px] text-gold`;
const smallBody = "mt-1.5 mb-0 text-sm leading-[1.55] text-muted";
const largeBody = "mt-2 mb-0 text-[15px] leading-[1.6] text-muted";

function Tile({ span = "single", className = "", children }: { span?: Span; className?: string; children: ReactNode }) {
  return <li className={`${tile} ${spanClass[span]} ${className}`}>{children}</li>;
}

const guests = [
  { name: "Sofia Marques", note: "2 guests", status: "Attending" },
  { name: "James Clarke", note: "vegetarian", status: "Attending" },
  { name: "Luca Bianchi", note: "1 guest", status: "Awaiting" },
];

const schedule = [
  ["3:00 pm", "Ceremony"],
  ["5:00 pm", "Cocktails"],
  ["7:00 pm", "Dinner"],
  ["9:30 pm", "Dancing"],
];

const waveform: [height: number, gold: boolean][] = [
  [40, false],
  [75, false],
  [55, false],
  [95, false],
  [60, false],
  [80, true],
  [45, true],
  [70, true],
  [35, true],
  [60, true],
  [40, true],
];

/** Features overview, rendered as the main content of the /features page. */
export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="bg-sand py-[clamp(64px,8vw,112px)]">
      <div className="shell">
        <div className="reveal flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
          <div className="min-w-0 flex-[1_1_520px]">
            <p className="mt-0 mb-3.5 font-serif text-[clamp(20px,4.6vw,26px)] italic text-olive">
              The first glimpse should be beautiful.
            </p>
            <h1
              id="features-title"
              className={`${displayHeading} max-w-[15em] text-[clamp(34px,6.8vw,54px)] text-balance`}
            >
              Everything your guests need, <em>in one link.</em>
            </h1>
          </div>
          <p className="m-0 flex-[0_1_380px] text-[17px] leading-[1.6] text-muted">
            Every ODEVELLE invitation is a complete wedding website, beautifully designed and simple for every guest.
          </p>
        </div>

        <ul className="mt-[clamp(36px,5vw,56px)] grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* RSVP dashboard */}
          <Tile span="tall" className="flex flex-col p-6.5">
            <h3 className={largeTitle}>RSVP and your guest dashboard</h3>
            <p className={`${largeBody} max-w-[30em]`}>
              Guests reply in a tap. You see who is coming, meal choices and notes, updated the moment they answer.
            </p>
            <div aria-hidden="true" className="mt-auto pt-5.5">
              <div className="rounded-[18px] border border-linen bg-cream p-4.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-serif text-xl font-semibold text-ink">Guest list</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-olive px-2.5 py-1 text-xs font-semibold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-butter" />
                    Live
                  </span>
                </div>
                <div className="mt-3.5 grid grid-cols-3 gap-2">
                  {[
                    ["86", "Attending", "text-olive"],
                    ["23", "Awaiting", "text-gold-deep"],
                    ["9", "Declined", "text-muted"],
                  ].map(([n, label, color]) => (
                    <div key={label} className="rounded-xl bg-white p-3">
                      <div className={`font-serif text-[28px] font-semibold leading-none ${color}`}>{n}</div>
                      <div className="mt-1 text-xs text-muted">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  {guests.map((g) => (
                    <div
                      key={g.name}
                      className="flex items-center justify-between gap-2.5 rounded-xl bg-white px-3 py-2.5 text-[13px]"
                    >
                      <span className="font-medium text-ink">
                        {g.name} <span className="font-normal text-muted">· {g.note}</span>
                      </span>
                      <span
                        className={`rounded-full px-2.25 py-0.75 text-xs font-semibold ${
                          g.status === "Attending" ? "bg-sage-wash text-olive-deep" : "bg-butter text-ink"
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 mb-0 text-xs text-muted">Sample dashboard</p>
              </div>
            </div>
          </Tile>

          {/* Opening animation */}
          <Tile span="wide" className="flex flex-wrap items-center gap-x-6 gap-y-4.5 p-6.5">
            <div className="min-w-0 flex-[1_1_200px]">
              <h3 className={largeTitle}>An opening to remember</h3>
              <p className={largeBody}>An envelope, a wax seal or a curtain reveal plays the moment the link opens.</p>
            </div>
            <div aria-hidden="true" className="relative mx-auto h-30 w-37.5 flex-none">
              <div className="animate-peek absolute inset-x-5.5 top-0 flex h-20 flex-col items-center gap-1.5 rounded-md border border-linen bg-white pt-3">
                <span className="font-serif text-[15px] italic text-olive">You&apos;re invited</span>
                <span className="h-px w-12.5 bg-butter-deep" />
              </div>
              <svg viewBox="0 0 150 90" className="absolute bottom-0 left-0 h-22.5 w-37.5">
                <path d="M4 4h142a3 3 0 0 1 3 3v76a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#F3E3A1" />
                <path d="M1 8l74 46 74-46v75a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3z" fill="#E9D79A" />
                <path d="M1 86l60-38M149 86L89 48" stroke="#D8C27C" strokeWidth="1" />
              </svg>
              <span className="animate-pulse-ring absolute top-16 left-15.25 flex h-7 w-7 items-center justify-center rounded-full bg-olive">
                <Sparkle size={12} fill="#F3E3A1" />
              </span>
            </div>
          </Tile>

          {/* Countdown */}
          <Tile className="flex flex-col p-6">
            <h3 className={smallTitle}>Countdown</h3>
            <p className={smallBody}>The days and hours until the doors open.</p>
            <div aria-hidden="true" className="mt-auto grid grid-cols-3 gap-1.5 pt-4.5">
              {[
                ["214", "days"],
                ["06", "hours"],
                ["42", "min"],
              ].map(([n, unit]) => (
                <div key={unit} className="rounded-xl bg-cream px-1 py-2.5 text-center">
                  <div className="font-serif text-[26px] font-semibold leading-none text-olive">{n}</div>
                  <div className="mt-1 text-xs text-muted">{unit}</div>
                </div>
              ))}
            </div>
          </Tile>

          {/* Venues */}
          <Tile className="flex flex-col p-6">
            <h3 className={smallTitle}>Venues and directions</h3>
            <p className={smallBody}>Ceremony and reception, one tap from the map.</p>
            <div
              aria-hidden="true"
              className="relative mt-auto h-24 overflow-hidden rounded-[14px]"
              style={{
                background:
                  "linear-gradient(28deg, transparent 46%, #FFFFFF 46% 50%, transparent 50%), linear-gradient(118deg, transparent 58%, #FFFFFF 58% 62%, transparent 62%), linear-gradient(0deg, transparent 70%, #FFFFFF 70% 73%, transparent 73%), #E3EADB",
              }}
            >
              <svg width="26" height="32" viewBox="0 0 24 30" className="absolute top-4.5 left-1/2 -translate-x-1/2">
                <path d="M12 29s10-9 10-17A10 10 0 0 0 2 12c0 8 10 17 10 17z" fill="#4A5E3F" />
                <circle cx="12" cy="12" r="4" fill="#F3E3A1" />
              </svg>
              <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink">
                Open in Maps
              </span>
            </div>
          </Tile>

          {/* Schedule */}
          <Tile span="wide" className="flex flex-col p-6.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h3 className={largeTitle}>The day, in order</h3>
              <span className="rounded-full bg-butter px-3 py-1.25 text-xs font-semibold text-ink">Dress code · Black tie</span>
            </div>
            <p className={largeBody}>Ceremony, toasts, dinner and dancing, so every guest knows where to be.</p>
            <ol
              aria-label="Sample schedule"
              className="mt-5 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2.5 p-0"
            >
              {schedule.map(([time, label]) => (
                <li key={time} className="rounded-[14px] bg-cream px-3.5 py-3">
                  <div className="font-serif text-xl font-semibold text-olive">{time}</div>
                  <div className="text-[13px] text-ink">{label}</div>
                </li>
              ))}
            </ol>
          </Tile>

          {/* Music */}
          <Tile className="flex flex-col p-6">
            <h3 className={smallTitle}>Your song</h3>
            <p className={smallBody}>Music of your choosing, playing softly as guests scroll.</p>
            <div aria-hidden="true" className="mt-auto flex items-center gap-3 pt-4.5">
              <span className="flex h-10.5 w-10.5 flex-none items-center justify-center rounded-full bg-olive">
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path d="M7 4l13 8-13 8z" fill="#F3E3A1" />
                </svg>
              </span>
              <span className="flex h-7.5 flex-auto items-center gap-0.75">
                {waveform.map(([h, gold], i) => (
                  <span
                    key={i}
                    className={`w-0.75 rounded-xs ${gold ? "bg-brass" : "bg-olive"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </span>
            </div>
          </Tile>

          {/* Gallery */}
          <Tile className="flex flex-col p-6">
            <h3 className={smallTitle}>Gallery and story</h3>
            <p className={smallBody}>Your photographs and the moments that led you here.</p>
            <div aria-hidden="true" className="relative mt-auto h-23">
              {[
                { left: "8%", top: 14, rotate: -8, from: "#A9B99A", to: "#6F8460" },
                { left: "36%", top: 4, rotate: 3, from: "#F3E3A1", to: "#C9B26A" },
                { left: "64%", top: 16, rotate: 9, from: "#E9E6DD", to: "#B3AFA3" },
              ].map((p) => (
                <span
                  key={p.left}
                  className="absolute h-17.5 w-15 bg-white px-1.25 pt-1.25 pb-3.5 shadow-[0_6px_14px_-6px_rgba(31,36,32,.35)]"
                  style={{ left: p.left, top: p.top, transform: `rotate(${p.rotate}deg)` }}
                >
                  <span className="block h-full w-full" style={{ background: `linear-gradient(160deg, ${p.from}, ${p.to})` }} />
                </span>
              ))}
            </div>
          </Tile>

          {/* Share band */}
          <li
            className={`reveal on-dark flex flex-wrap items-center justify-between gap-x-8 gap-y-5.5 rounded-3xl bg-olive p-[clamp(24px,3vw,34px)] text-cream ${spanClass.full}`}
          >
            <div className="min-w-0 flex-[1_1_320px]">
              <h3 className={`${tileTitle} text-[30px] text-butter`}>Shared in one link</h3>
              <p className="mt-2 mb-0 text-[15px] leading-[1.6] text-linen">
                Send it on WhatsApp, Instagram or email. Guests open it instantly on any phone, with no app and no sign
                up. So simple, even grandparents can RSVP in a tap.
              </p>
              <div aria-hidden="true" className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-cream/12 px-3.5 py-2 text-[13px] text-cream">
                  <LinkIcon size={14} stroke="#F3E3A1" />
                  [domain]/charlotte-and-henry
                </span>
                {["WhatsApp", "Instagram", "Email"].map((c) => (
                  <span key={c} className="rounded-full bg-cream/12 px-3.5 py-2 text-[13px] text-cream">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-[0_1_auto] flex-wrap gap-3">
              <Link href={ctaLinks.begin} transitionTypes={transitionTypesFor(ctaLinks.begin, "/features")} className={button("light", "min-h-13.5 gap-2.5 px-7 text-base font-semibold")}>
                Begin your invitation
              </Link>
              <Link href={ctaLinks.pricing} transitionTypes={transitionTypesFor(ctaLinks.pricing, "/features")} className={button("line", "min-h-13.5 px-5.5 text-base")}>
                See what each plan includes
              </Link>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
