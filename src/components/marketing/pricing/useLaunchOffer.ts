"use client";

import { useSyncExternalStore } from "react";
import { isLaunchOfferActive } from "@/content/marketing/pricing";

const noSubscribe = () => () => {};

/**
 * Whether the launch offer is running for this visitor right now.
 *
 * The page is prerendered (with the offer shown); the visitor's clock is checked
 * after hydration, so once the offer has ended the site switches to the regular
 * prices without a redeploy.
 */
export function useLaunchOfferActive() {
  return useSyncExternalStore(noSubscribe, () => isLaunchOfferActive(), () => true);
}
