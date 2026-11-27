"use client";

import Link from "next/link";
import { button } from "@/components/marketing/ui";

/** A failed read (e.g. a database outage): never shown as an empty dashboard. */
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="shell grid min-h-[70dvh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <p className="m-0 text-xs font-medium uppercase tracking-[.22em] text-olive">Couple Dashboard</p>
        <h1 className="m-0 mt-3 font-serif text-[40px] leading-tight font-medium text-gold">We couldn’t load your replies</h1>
        <p className="m-0 mt-3 text-muted">Your guests’ replies are safe. Please try again in a moment.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className={button("primary", "min-h-11 cursor-pointer border-0 px-6 text-[15px]")}>
            Try again
          </button>
          <Link href="/" className={button("ghost", "min-h-11 px-6 text-[15px]")}>
            ODEVELLE home
          </Link>
        </div>
      </div>
    </main>
  );
}
