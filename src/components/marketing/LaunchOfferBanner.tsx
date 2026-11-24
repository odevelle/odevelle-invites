"use client";

import { launchOffer } from "@/content/marketing/pricing";
import { Sparkle } from "./icons";
import { useLaunchOfferActive } from "./pricing/useLaunchOffer";

/** Launch offer message for the banner; renders nothing once the offer has ended. */
export function LaunchOfferBannerItem() {
  const active = useLaunchOfferActive();
  if (!active) return null;
  return (
    <>
      <span>
        Launch offer: <strong className="font-semibold">{launchOffer.percentOff}% off</strong> every invitation until{" "}
        {launchOffer.endsLabel}
      </span>
      <Sparkle size={10} />
    </>
  );
}
