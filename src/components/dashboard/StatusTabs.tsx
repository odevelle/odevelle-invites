import Link from "next/link";
import type { RsvpSummary } from "@/dashboard/data";
import { dashboardHref, type DashboardQuery, type StatusFilter } from "@/dashboard/query";

/** All / Attending / Declined, each with its reply count. Links, so the server filters and the URL can be shared. */
export function StatusTabs({ slug, query, summary }: { slug: string; query: DashboardQuery; summary: RsvpSummary }) {
  const tabs: { status: StatusFilter; label: string; count: number }[] = [
    { status: "all", label: "All", count: summary.total },
    { status: "attending", label: "Attending", count: summary.attending },
    { status: "declined", label: "Declined", count: summary.declined },
  ];
  return (
    <nav aria-label="Filter replies" className="flex max-w-full overflow-x-auto rounded-full border border-linen bg-white/70 p-1 no-scrollbar">
      {tabs.map((t) => {
        const current = t.status === query.status;
        return (
          <Link
            key={t.status}
            href={dashboardHref(slug, { status: t.status, q: query.q })}
            scroll={false}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2 rounded-full px-3 text-sm whitespace-nowrap no-underline transition-colors sm:px-4 ${
              current ? "bg-olive text-white" : "text-ink hover:bg-sand"
            }`}
          >
            {t.status === "all" ? (
              <span>
                All<span className="hidden sm:inline"> responses</span>
              </span>
            ) : (
              t.label
            )}
            <span className={`rounded-full px-2 text-xs tabular-nums ${current ? "bg-white/20" : "bg-sand text-muted"}`}>{t.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
