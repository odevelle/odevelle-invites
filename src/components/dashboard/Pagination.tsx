import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/marketing/icons";
import { dashboardHref, PAGE_SIZE, type DashboardQuery } from "@/dashboard/query";

export function Pagination({ slug, query, total, pageCount }: { slug: string; query: DashboardQuery; total: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const from = (query.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, query.page * PAGE_SIZE);
  const link = "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink/15 px-4 text-sm text-ink no-underline hover:border-ink";
  const disabled = "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-linen px-4 text-sm text-stone";
  return (
    <nav aria-label="Pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 text-sm text-muted tabular-nums">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {query.page > 1 ? (
          <Link href={dashboardHref(slug, { ...query, guest: undefined, page: query.page - 1 })} scroll={false} className={link} rel="prev">
            <ChevronLeft size={14} /> Previous
          </Link>
        ) : (
          <span className={disabled} aria-hidden="true"><ChevronLeft size={14} /> Previous</span>
        )}
        <span className="px-2 text-sm text-muted tabular-nums">
          Page {query.page} of {pageCount}
        </span>
        {query.page < pageCount ? (
          <Link href={dashboardHref(slug, { ...query, guest: undefined, page: query.page + 1 })} scroll={false} className={link} rel="next">
            Next <ChevronRight size={14} />
          </Link>
        ) : (
          <span className={disabled} aria-hidden="true">Next <ChevronRight size={14} /></span>
        )}
      </div>
    </nav>
  );
}
