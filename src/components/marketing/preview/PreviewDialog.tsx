"use client";

import { useState } from "react";
import { designById, designs, type DesignId } from "@/content/marketing/designs";
import { prices, regularPrices } from "@/content/marketing/pricing";
import { ChatBubble, Check, ChevronLeft, ChevronRight, Close, Replay } from "../icons";
import { InviteMockup } from "../invite-mockup/InviteMockup";
import { useLaunchOfferActive } from "../pricing/useLaunchOffer";
import { useDialogBehaviour } from "../useDialogBehaviour";
import { LiveInvitation } from "./LiveInvitation";

const order = designs.map((d) => d.id);

const features = [
  "Animated opening",
  "RSVP and guest dashboard",
  "Ceremony and reception maps",
  "Countdown",
  "Music and gallery",
  "Your own palette",
];

const roundButton =
  "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink/18 bg-transparent text-ink";

export function PreviewDialog({
  initialId,
  onClose,
  onChoose,
}: {
  initialId: DesignId;
  onClose: () => void;
  onChoose: (id: DesignId) => void;
}) {
  const [id, setId] = useState<DesignId>(initialId);
  const offerActive = useLaunchOfferActive();
  // Entry price (Classic, GBP): the launch price while the offer runs, the regular price after.
  const fromPrice = offerActive ? prices.GBP.classic : regularPrices.GBP.classic;
  const [replayKey, setReplayKey] = useState(0);
  const [colourIndex, setColourIndex] = useState(0);
  const ref = useDialogBehaviour<HTMLDivElement>(true, onClose);

  const design = designById[id];
  const index = order.indexOf(id);
  const go = (n: number) => {
    setId(order[(n + order.length) % order.length]);
    setColourIndex(0);
  };
  // Shipped designs preview the real invitation, in the chosen colourway.
  const colourway = design.live?.colourways[colourIndex];

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Invitation preview"
      className="fixed inset-0 z-100 flex items-end justify-center bg-[rgba(31,36,32,.62)] p-[clamp(0px,3vw,40px)]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[94dvh] w-[min(1120px,100%)] overflow-y-auto rounded-t-[26px] bg-cream shadow-[0_40px_80px_-30px_rgba(0,0,0,.5)]">
        <div className="relative flex w-full flex-wrap bg-cream text-base leading-[1.6] text-ink">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className={`${roundButton} absolute top-4 right-4 z-5 bg-cream`}
          >
            <Close size={18} />
          </button>

          {/* Live phone */}
          <div className="relative flex min-w-0 flex-[1_1_380px] flex-col items-center justify-center gap-5.5 overflow-hidden bg-sand px-6 pt-14 pb-9">
            <div
              aria-hidden="true"
              className="absolute top-10 left-1/2 h-[120%] w-[min(78%,380px)] -translate-x-1/2"
              style={{
                borderRadius: "50% 50% 0 0 / 30% 30% 0 0",
                background: "radial-gradient(120% 70% at 50% 10%, #7F9070 0%, #5E7250 50%, #4A5E3F 100%)",
              }}
            />
            <p className="absolute top-4.5 left-5 m-0 flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-[13px] uppercase tracking-[.14em] text-olive">
              <span aria-hidden="true" className="h-1.75 w-1.75 rounded-full bg-olive" />
              Live invitation
            </p>
            <div className="relative w-[min(270px,72%)]">
              {colourway ? (
                <LiveInvitation
                  key={`${colourway.slug}-${replayKey}`}
                  slug={colourway.slug}
                  title={`${design.title} invitation in ${colourway.name}, live`}
                />
              ) : (
                <InviteMockup key={`${id}-${replayKey}`} design={id} />
              )}
            </div>
            {design.live && design.live.colourways.length > 1 && (
              <div role="group" aria-label="Colourway" className="relative flex flex-wrap justify-center gap-2">
                {design.live.colourways.map((c, i) => (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={i === colourIndex}
                    onClick={() => setColourIndex(i)}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[15px] ${
                      i === colourIndex ? "border-cream bg-cream text-ink" : "border-[rgba(247,245,239,.55)] bg-transparent text-cream"
                    }`}
                  >
                    <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full shadow-[0_0_0_1.5px_rgba(247,245,239,.8)]" style={{ background: c.swatch }} />
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div className="relative flex flex-wrap justify-center gap-2.5">
              {(!colourway || colourway.intro) && (
                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-0 bg-cream px-4.5 text-[15px] text-ink"
                >
                  <Replay size={16} />
                  Replay the opening
                </button>
              )}
              <a
                href={colourway ? `/sites/${colourway.slug}` : "#demo"}
                {...(colourway && { target: "_blank", rel: "noopener" })}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[rgba(247,245,239,.55)] px-4.5 text-[15px] text-cream no-underline"
              >
                View the full invitation
                {colourway && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            </div>
          </div>

          {/* Details */}
          <div className="flex min-w-0 flex-[1.15_1_420px] flex-col px-[clamp(22px,4vw,56px)] pt-[clamp(28px,5vw,56px)] pb-[clamp(28px,4vw,48px)]">
            <div className="flex items-center gap-3 pr-13">
              <p className="m-0 text-[13px] font-medium uppercase tracking-[.2em] text-olive">
                Wedding collection · {`0${index + 1} / 04`}
              </p>
              <div className="ml-auto flex gap-1.5">
                <button type="button" onClick={() => go(index - 1)} aria-label="Previous design" className={roundButton}>
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => go(index + 1)} aria-label="Next design" className={roundButton}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <h2 className="mt-3.5 mb-0 font-serif text-[clamp(40px,8vw,60px)] font-medium leading-none tracking-[-0.02em] text-gold">
              {design.title}
            </h2>
            <p className="mt-4 mb-0 max-w-[32em] text-base text-pretty text-muted">{design.story}</p>

            <p className="mt-6.5 mb-2.5 text-[13px] uppercase tracking-[.18em] text-muted">Colour story</p>
            <ul aria-label="Colour story" className="m-0 flex list-none gap-2.5 p-0">
              {design.palette.map((hex) => (
                <li
                  key={hex}
                  className="h-10 w-10 rounded-full shadow-[inset_0_0_0_1px_rgba(31,36,32,.12)]"
                  style={{ background: hex }}
                >
                  <span className="sr-only">{hex}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-6.5 mb-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-x-5 gap-y-2.5 border-t border-ink/10 pt-5 text-[15px]">
              {features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check size={18} className="mt-0.5 flex-none" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-7.5">
              <p className="m-0 flex flex-col leading-[1.1]">
                <span className="text-[13px] uppercase tracking-[.18em] text-muted">From</span>
                <span className="mt-1.5 font-price text-[40px] font-semibold italic tracking-[-0.015em] lining-nums">{fromPrice}</span>
              </p>
              <a href="#pricing" onClick={onClose} className="py-2.5 text-[15px] font-medium text-olive underline">
                Compare plans
              </a>
            </div>
            <div className="mt-4.5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onChoose(id)}
                className="min-h-14 flex-[1_1_220px] cursor-pointer rounded-full border-0 bg-olive text-[17px] font-medium text-white shadow-[0_14px_28px_-14px_rgba(74,94,63,.75)]"
              >
                Choose this design
              </button>
              <a
                href="#whatsapp"
                onClick={onClose}
                className="flex min-h-14 flex-[1_1_180px] items-center justify-center gap-2.5 rounded-full border border-ink/30 text-base text-ink no-underline"
              >
                <ChatBubble size={18} />
                Ask the studio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
