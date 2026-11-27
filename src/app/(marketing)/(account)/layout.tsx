import type { Metadata } from "next";

/*
 * The couple's account pages: sign-in and the RSVP dashboard. They share the
 * marketing site's root layout (brand fonts and tokens), never an invitation
 * theme. Private: not indexed, and proxy.ts marks responses no-store.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-cream text-ink">{children}</div>;
}
