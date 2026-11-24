import type { Metadata, Viewport } from "next";
import {
  Bodoni_Moda,
  Cormorant_Garamond,
  Great_Vibes,
  Inter,
  Manrope,
} from "next/font/google";
// Price figures: Fraunces Variable (Fontsource, self-hosted from node_modules), italic with
// weight + optical-size axes. Licensed under the SIL Open Font License (see the package's LICENSE).
import "@fontsource-variable/fraunces/opsz-italic.css";
import "./globals.css";

// Brand faces: Cormorant Garamond (display) and Inter (text).
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

// Faces used only inside the invitation mockups (phones and paper cards).
const bodoni = Bodoni_Moda({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-bodoni-moda",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope-sans",
  display: "swap",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-great-vibes",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ODEVELLE · Digital Wedding Invitations, Designed by Hand",
  description:
    "ODEVELLE designs personalised wedding invitation websites, illustrated by hand and composed around your story. One link carries your day to every guest, and their replies gather quietly in your dashboard.",
};

export const viewport: Viewport = {
  themeColor: "#F7F5EF",
};

export default function MarketingRootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${inter.variable} ${bodoni.variable} ${manrope.variable} ${greatVibes.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
