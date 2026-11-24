import { marqueeItems } from "@/content/marketing/navigation";
import { Sparkle } from "./icons";
import { LaunchOfferBannerItem } from "./LaunchOfferBanner";

function Run({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className="flex items-center gap-7.5 pr-7.5">
      <LaunchOfferBannerItem />
      {marqueeItems.map((item) => (
        <span key={item} className="contents">
          <span>{item}</span>
          <Sparkle size={10} />
        </span>
      ))}
    </div>
  );
}

/** Butter-yellow ribbon of highlights. The second run is a visual duplicate for a seamless loop. */
export function Marquee() {
  return (
    <section aria-label="Launch offer and highlights" className="overflow-hidden border-y border-butter-deep bg-butter text-ink">
      <div className="animate-marquee flex w-max py-3.75 font-serif text-lg font-normal whitespace-nowrap italic">
        <Run />
        <Run hidden />
      </div>
    </section>
  );
}
