"use client";

import { useState, type ReactNode } from "react";
import {
  comparison,
  currencies,
  launchOffer,
  plans,
  prices,
  regularPrices,
  type Currency,
  type Plan,
} from "@/content/marketing/pricing";
import { Check, ChevronDown, Sparkle } from "../icons";
import { button } from "../ui";
import { useLaunchOfferActive } from "./useLaunchOffer";

const glassCard =
  "border border-white/75 bg-[linear-gradient(155deg,rgba(255,255,255,.82)_0%,rgba(255,255,255,.5)_55%,rgba(247,245,239,.38)_100%)] shadow-[0_28px_60px_-34px_rgba(31,36,32,.4),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-[18px] backdrop-saturate-[1.3]";

const featuredCard =
  "on-dark border border-[rgba(243,227,161,.6)] text-cream shadow-[0_40px_80px_-34px_rgba(31,40,26,.7),inset_0_1px_0_rgba(255,255,255,.28)] backdrop-blur-[18px] backdrop-saturate-[1.2]";

const featuredBackground =
  "radial-gradient(110% 55% at 12% 0%, rgba(243,227,161,.34) 0%, rgba(243,227,161,0) 60%), radial-gradient(90% 60% at 100% 100%, rgba(201,178,106,.22) 0%, rgba(201,178,106,0) 60%), linear-gradient(160deg, rgba(98,120,84,.94) 0%, rgba(66,84,55,.95) 50%, rgba(40,52,34,.97) 100%)";

export function PricingPlans({ intro }: { intro: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [compareOpen, setCompareOpen] = useState(false);
  const offerActive = useLaunchOfferActive();

  return (
    <>
      <div className="reveal flex flex-col items-center text-center">
        {intro}
        {offerActive && (
          <p className="mt-5 mb-0 inline-flex items-center gap-2 rounded-full bg-butter px-4 py-1.5 text-[13px] font-semibold tracking-[.04em] text-ink">
            <Sparkle size={11} />
            Launch offer: {launchOffer.percentOff}% off every invitation until {launchOffer.endsLabel}
          </p>
        )}
        <div
          role="group"
          aria-label="Currency"
          className={`${offerActive ? "mt-4.5" : "mt-6.5"} inline-flex rounded-full border border-white/80 bg-white/55 p-1 shadow-[0_10px_24px_-18px_rgba(31,36,32,.4)] backdrop-blur-[14px]`}
        >
          {currencies.map((code) => {
            const active = code === currency;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => setCurrency(code)}
                className={`min-h-10 min-w-16 cursor-pointer rounded-full border-0 px-3.5 text-sm font-medium tracking-[.06em] ${
                  active ? "bg-ink text-cream" : "bg-transparent text-ink"
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-[clamp(32px,5vw,56px)] flex flex-wrap items-stretch gap-5">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            price={offerActive ? prices[currency][plan.id] : regularPrices[currency][plan.id]}
            regularPrice={offerActive ? regularPrices[currency][plan.id] : undefined}
          />
        ))}
      </div>

      <div className="mt-7 flex justify-center">
        <button
          type="button"
          onClick={() => setCompareOpen((v) => !v)}
          aria-expanded={compareOpen}
          aria-controls="compare-table"
          className="link-draw inline-flex min-h-11 cursor-pointer items-center gap-2.5 border-0 bg-transparent px-1 text-base font-medium text-olive"
        >
          {compareOpen ? "Hide the comparison" : "Compare every detail"}
          <ChevronDown
            size={14}
            className="transition-transform duration-300"
            style={{ transform: `rotate(${compareOpen ? 180 : 0}deg)` }}
          />
        </button>
      </div>

      {compareOpen && <ComparisonTable />}
    </>
  );
}

/** `regularPrice` is passed only while the launch offer runs; it renders crossed out beside the launch price. */
function PlanCard({ plan, price, regularPrice }: { plan: Plan; price: string; regularPrice?: string }) {
  const featured = !!plan.featured;
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={`reveal flex min-w-0 flex-[1_1_290px] flex-col rounded-[26px] px-7.5 pt-8.5 pb-7.5 ${
        featured ? featuredCard : glassCard
      }`}
      style={featured ? { background: featuredBackground } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          id={`plan-${plan.id}`}
          className={`m-0 font-serif text-[28px] font-medium ${featured ? "text-butter" : "text-gold"}`}
        >
          {plan.name}
        </h3>
        {featured && (
          <span className="rounded-full bg-butter px-3 py-1.25 text-[13px] font-semibold uppercase tracking-[.14em] text-ink">
            Recommended
          </span>
        )}
      </div>
      <p className={`mt-1.5 mb-0 text-[15px] ${featured ? "text-linen" : "text-muted"}`}>{plan.summary}</p>
      {regularPrice ? (
        <>
          <p
            data-testid="launch-label"
            className="mt-5.5 mb-0 self-start rounded-full bg-butter px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[.12em] text-ink"
          >
            {launchOffer.percentOff}% off · Launch offer
          </p>
          <p className="mt-3 mb-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="sr-only">Launch price </span>
            <span data-testid="price" className="font-price text-[46px] font-semibold italic leading-none tracking-[-0.015em] lining-nums">
              {price}
            </span>
            <span className="sr-only">, regular price </span>
            <s
              data-testid="regular-price"
              className={`font-price text-xl font-normal italic leading-none lining-nums decoration-1 ${
                featured ? "text-linen/75" : "text-muted/80"
              }`}
            >
              {regularPrice}
            </s>
          </p>
          <p className={`mt-2.5 mb-0 text-[13px] ${featured ? "text-linen" : "text-muted"}`}>
            Launch price until {launchOffer.endsLabel}
          </p>
        </>
      ) : (
        <p
          data-testid="price"
          className="mt-5.5 mb-0 font-price text-[46px] font-semibold italic leading-none tracking-[-0.015em] lining-nums"
        >
          {price}
        </p>
      )}
      <ul
        className={`mt-6 mb-0 flex flex-auto list-none flex-col gap-3 border-t pt-5.5 text-[15px] ${
          featured ? "border-cream/18" : "border-ink/10"
        }`}
      >
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check size={18} stroke={featured ? "#E9E6DD" : "#4A5E3F"} className="mt-0.5 flex-none" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={plan.cta.href}
        className={
          featured
            ? "btn mt-7 flex min-h-13 items-center justify-center rounded-full bg-cream text-base font-medium text-ink no-underline hover:bg-butter-deep hover:text-ink"
            : button("ghost", "mt-7 flex min-h-13 text-base")
        }
      >
        {plan.cta.label}
      </a>
    </article>
  );
}

function ComparisonTable() {
  const cell = (v: string) =>
    v === "y"
      ? { sym: "✓", sr: "Included", color: "#4A5E3F" }
      : v === "n"
        ? { sym: "×", sr: "Not included", color: "#B3AFA3" }
        : { sym: v, sr: "", color: "#1F2420" };

  return (
    <div id="compare-table" className="mt-5 overflow-x-auto rounded-[18px] border border-ink/8 bg-cream">
      <table className="w-full min-w-140 border-collapse text-[15px]">
        <caption className="sr-only">Plans compared side by side</caption>
        <thead>
          <tr className="text-left">
            <th scope="col" className="px-5.5 py-4.5 text-[13px] font-medium uppercase tracking-widest text-muted">
              Feature
            </th>
            {plans.map((p) => (
              <th
                key={p.id}
                scope="col"
                className={`px-3 py-4.5 text-center font-serif text-[19px] font-medium ${p.featured ? "text-olive" : ""}`}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.map(([label, ...values]) => (
            <tr key={label} className="border-t border-ink/8">
              <th scope="row" className="px-5.5 py-3.5 text-left font-normal">
                {label}
              </th>
              {values.map((v, i) => {
                const c = cell(v);
                return (
                  <td key={i} className="px-3 py-3.5 text-center" style={{ color: c.color }}>
                    <span aria-hidden="true">{c.sym}</span>
                    {c.sr && <span className="sr-only">{c.sr}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
