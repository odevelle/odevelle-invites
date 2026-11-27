export type NavLink = { label: string; href: string };

/*
 * Links are root-relative ("/#pricing") so they work from every marketing page,
 * not only the landing page.
 */

/** Shared call-to-action targets on the landing page. */
export const ctaLinks = {
  begin: "/#begin",
  whatsapp: "/#whatsapp",
  pricing: "/#pricing",
  designs: "/#designs",
} as const;

export const featuresPage: NavLink = { label: "Features", href: "/features" };

/** Header navigation (desktop). */
export const primaryNav: NavLink[] = [
  { label: "Designs", href: "/#designs" },
  { label: "How It Works", href: "/#how-it-works" },
  featuresPage,
  { label: "Pricing", href: "/#pricing" },
  { label: "Questions", href: "/#faq" },
  { label: "Contact", href: "/#begin" },
];

/** Full-screen mobile menu. */
export const mobileNav: NavLink[] = [
  { label: "Designs", href: "/#designs" },
  { label: "How It Works", href: "/#how-it-works" },
  featuresPage,
  { label: "Pricing", href: "/#pricing" },
  { label: "Questions", href: "/#faq" },
  { label: "Contact", href: "/#begin" },
];

/** The couple's RSVP dashboard: /dashboard sends anyone signed out to /login. */
export const clientLogin: NavLink = { label: "Couple Dashboard", href: "/dashboard" };

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Studio",
    links: [
      { label: "Designs", href: "/#designs" },
      featuresPage,
      { label: "Pricing", href: "/#pricing" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Kind Words", href: "/#kind-words" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact", href: "/#begin" },
      { label: "Questions", href: "/#faq" },
      clientLogin,
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/#privacy" },
      { label: "Terms", href: "/#terms" },
      { label: "Refunds", href: "/#refunds" },
    ],
  },
];

/** Banner highlights. The launch offer message is added in front while the offer runs (see Marquee). */
export const marqueeItems = [
  "A private RSVP dashboard with every invitation",
  "Unlimited guests, one link",
  "Shared in a tap on WhatsApp, Instagram or email",
  "Written in the languages your family speaks",
];
