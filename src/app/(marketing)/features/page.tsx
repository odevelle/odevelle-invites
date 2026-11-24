import type { Metadata } from "next";
import { Features } from "@/components/marketing/Features";
import { SiteHeader } from "@/components/marketing/header/SiteHeader";
import { PageTransition } from "@/components/marketing/PageTransition";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { StickyCta } from "@/components/marketing/StickyCta";

export const metadata: Metadata = {
  title: "Features · ODEVELLE",
  description:
    "Every ODEVELLE invitation is a complete wedding website: RSVP and a guest dashboard, an animated opening, countdown, venues and directions, the day in order, your song, gallery and story, shared in one link.",
};

export default function FeaturesPage() {
  return (
    <PageTransition>
      <div id="top" className="relative">
        <SiteHeader currentPath="/features" />
        <main id="main" className="relative">
          <Features />
          <StickyCta currentPath="/features" />
        </main>
        <SiteFooter currentPath="/features" />
      </div>
    </PageTransition>
  );
}
