export const currencies = ["GBP", "USD", "EUR", "INR"] as const;
export type Currency = (typeof currencies)[number];

export type PlanId = "classic" | "signature" | "exclusive";

/** Launch prices per currency (30% off the regular prices below). */
export const prices: Record<Currency, Record<PlanId, string>> = {
  GBP: { classic: "£99", signature: "£130", exclusive: "£299" },
  USD: { classic: "$99", signature: "$175", exclusive: "$330" },
  EUR: { classic: "€149", signature: "€170", exclusive: "€500" },
  INR: { classic: "₹7,500", signature: "₹12,000", exclusive: "₹25,000" },
};

/*
 * Launch offer: 30% off every plan until 31 December 2026.
 *
 * The cards show the launch price with the regular price crossed out. That is
 * honest only while both of these are true:
 *   1. The offer really ends at `endsAt`, for everyone. The site enforces this:
 *      after `endsAt` it shows the regular prices and drops the offer UI.
 *   2. The regular prices below are what ODEVELLE actually charges from
 *      1 January 2027.
 * Each launch price is at least 30% below its regular price (savings of
 * 30.0%–31.7%), so "30% off" never overstates the saving.
 */
export const launchOffer = {
  percentOff: 30,
  /** End of 31 December in Goa (IST), where the studio is based. */
  endsAt: "2026-12-31T23:59:59+05:30",
  endsLabel: "31 December",
} as const;

export function isLaunchOfferActive(now: number = Date.now()) {
  return now <= Date.parse(launchOffer.endsAt);
}

/** Regular prices, charged once the launch offer ends. */
export const regularPrices: Record<Currency, Record<PlanId, string>> = {
  GBP: { classic: "£145", signature: "£190", exclusive: "£430" },
  USD: { classic: "$145", signature: "$250", exclusive: "$475" },
  EUR: { classic: "€215", signature: "€245", exclusive: "€715" },
  INR: { classic: "₹10,750", signature: "₹17,150", exclusive: "₹35,750" },
};

export type Plan = {
  id: PlanId;
  name: string;
  summary: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
};

export const plans: Plan[] = [
  {
    id: "classic",
    name: "Classic",
    summary: "Your invitation, beautifully composed.",
    features: [
      "Any design from the collection",
      "Your names, dates and venues",
      "RSVP form and private dashboard",
      "[N] round of refinements",
    ],
    cta: { label: "Choose Classic", href: "#collection" },
  },
  {
    id: "signature",
    name: "Signature",
    summary: "The complete invitation experience.",
    features: [
      "Everything in Classic",
      "Music, gallery and your story",
      "Your own palette and typography",
      "[N] rounds of refinements",
    ],
    cta: { label: "Choose Signature", href: "#collection" },
    featured: true,
  },
  {
    id: "exclusive",
    name: "Exclusive",
    summary: "Fully customised, illustrated from a blank page for you alone.",
    features: [
      "Everything in Signature",
      "A hand drawn illustration of you both",
      "Written in more than one language",
      "Priority delivery",
    ],
    cta: { label: "Arrange a consultation", href: "#begin" },
  },
];

/** "y" = included, "n" = not included, anything else is shown as text. */
export const comparison: [label: string, classic: string, signature: string, exclusive: string][] = [
  ["Animated opening", "y", "y", "y"],
  ["RSVP form and guest dashboard", "y", "y", "y"],
  ["Countdown, maps and schedule", "y", "y", "y"],
  ["Your music", "n", "y", "y"],
  ["Gallery and love story", "n", "y", "y"],
  ["Your own palette and typography", "n", "y", "y"],
  ["Hand drawn illustration of you both", "n", "n", "y"],
  ["Languages", "1", "1", "[N]"],
  ["Rounds of refinements", "[N]", "[N]", "[N]"],
  ["Delivered within", "[N] days", "[N] days", "[N] days"],
  ["Invitation stays online for", "[N] months", "[N] months", "[N] months"],
];
