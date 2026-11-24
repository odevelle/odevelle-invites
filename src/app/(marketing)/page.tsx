import { Collection } from "@/components/marketing/Collection";
import { Contact } from "@/components/marketing/contact/Contact";
import { Faq } from "@/components/marketing/faq/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { SiteHeader } from "@/components/marketing/header/SiteHeader";
import { Hero } from "@/components/marketing/Hero";
import { Marquee } from "@/components/marketing/Marquee";
import { PageTransition } from "@/components/marketing/PageTransition";
import { DesignStudioProvider } from "@/components/marketing/preview/DesignStudio";
import { Pricing } from "@/components/marketing/pricing/Pricing";
import { Process } from "@/components/marketing/Process";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { StickyCta } from "@/components/marketing/StickyCta";
import { Studio } from "@/components/marketing/Studio";
import { Subscribe } from "@/components/marketing/Subscribe";
import { Testimonials } from "@/components/marketing/Testimonials";

// The features overview lives on its own page: /features (see ./features/page.tsx).
export default function LandingPage() {
  return (
    <PageTransition>
      <div id="top" className="relative">
        <SiteHeader />

        <DesignStudioProvider>
          <main id="main">
            <Hero />
            {/* The sticky mobile CTA lives inside this wrapper so it rides along from the marquee to the footer. */}
            <div className="relative">
              <Marquee />
              <Collection />
              <Process />
              <Pricing />
              <Studio />
              <Testimonials />
              <FinalCta />
              <Faq />
              <Contact />
              <Subscribe />
              <StickyCta />
            </div>
          </main>
          <SiteFooter />
        </DesignStudioProvider>
      </div>
    </PageTransition>
  );
}
