import Link from "next/link";
import { button } from "@/components/marketing/ui";
import type { CoupleInvitation, ResponsePage, RsvpSummary } from "@/dashboard/data";
import { formatEventDate, formatSubmittedAt, guestsLabel } from "@/dashboard/format";
import { dashboardHref, queryString, type DashboardQuery } from "@/dashboard/query";
import type { RsvpResponseRow } from "@/lib/supabase/database.types";
import { DashboardHeader } from "./DashboardHeader";
import { GuestDetails } from "./GuestDetails";
import { GuestSearch } from "./GuestSearch";
import { GuestTable } from "./GuestTable";
import { Pagination } from "./Pagination";
import { RefreshButton } from "./RefreshButton";
import { StatusTabs } from "./StatusTabs";
import { SummaryFigures } from "./SummaryFigures";

/** One invitation's dashboard, from data already loaded (and authorised) by the page. Presentational. */
export function DashboardView({
  email,
  invitations,
  invitation,
  query,
  summary,
  page,
  showMeal,
  selected,
  updatedAt,
}: {
  email: string | null;
  invitations: CoupleInvitation[];
  invitation: CoupleInvitation;
  query: DashboardQuery;
  summary: RsvpSummary;
  page: ResponsePage;
  showMeal: boolean;
  selected: RsvpResponseRow | null;
  /** "14:05", in the invitation's time zone. */
  updatedAt: string;
}) {
  const filtered = query.status !== "all" || query.q !== "";
  const tz = invitation.timeZone;
  return (
    <>
      <DashboardHeader email={email} invitations={invitations} current={invitation.slug} />
      <main id="main" className="shell py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <p className="m-0 text-xs font-medium uppercase tracking-[.22em] text-olive">Guest replies</p>
            <h1 className="m-0 mt-2 font-serif text-[40px] leading-[1.05] font-medium text-gold sm:text-[48px]">{invitation.title}</h1>
            <p className="m-0 mt-2 text-[15px] text-muted">
              {[invitation.primaryDate && formatEventDate(invitation.primaryDate), invitation.status === "draft" ? "Not yet published" : null]
                .filter(Boolean)
                .join(" · ") || "Only you can see these replies."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RefreshButton updatedAt={updatedAt} />
            <a
              href={`/dashboard/${invitation.slug}/export${queryString({ status: query.status, q: query.q })}`}
              download
              className={button("outline", "min-h-10 gap-2 px-4 text-sm font-medium")}
              title={filtered ? "Exports the replies matching your filter and search" : "Exports every reply"}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
              </svg>
              {filtered ? "Export filtered CSV" : "Export CSV"}
            </a>
          </div>
        </div>

        <div className="mt-8">
          <SummaryFigures summary={summary} />
        </div>

        <section aria-labelledby="replies-heading" className="mt-10">
          <h2 id="replies-heading" className="sr-only">
            Replies
          </h2>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <StatusTabs slug={invitation.slug} query={query} summary={summary} />
            <GuestSearch slug={invitation.slug} status={query.status} q={query.q} />
          </div>
          <p className="m-0 mb-3 text-sm text-muted" role="status">
            {resultLine(page.total, query)}
          </p>

          {page.rows.length > 0 ? (
            <>
              <GuestTable slug={invitation.slug} query={query} rows={page.rows} timeZone={tz} showMeal={showMeal} />
              <Pagination slug={invitation.slug} query={query} total={page.total} pageCount={page.pageCount} />
            </>
          ) : (
            <EmptyState slug={invitation.slug} query={query} hasReplies={summary.total > 0} />
          )}
        </section>

        <p className="mt-10 text-center text-xs text-muted">Only you can see these replies. Your guests never see each other’s answers.</p>
      </main>

      {selected && (
        <GuestDetails
          key={selected.id}
          closeHref={dashboardHref(invitation.slug, { ...query, guest: undefined })}
          guest={{
            name: selected.guest_name,
            attending: selected.attending,
            guests: selected.attending ? guestsLabel(selected.party_size) : "Not attending",
            meal: selected.meal_preference,
            showMeal,
            message: selected.message,
            submittedAt: formatSubmittedAt(selected.submitted_at, tz),
            possibleDuplicate: selected.same_name_count > 1,
          }}
        />
      )}
    </>
  );
}


function resultLine(total: number, query: DashboardQuery): string {
  const replies = `${total} ${total === 1 ? "reply" : "replies"}`;
  const which = query.status === "attending" ? " attending" : query.status === "declined" ? " declined" : "";
  return query.q ? `${replies}${which} matching “${query.q}”` : `${replies}${which}`;
}

function EmptyState({ slug, query, hasReplies }: { slug: string; query: DashboardQuery; hasReplies: boolean }) {
  if (!hasReplies) {
    return (
      <div className="rounded-[18px] border border-dashed border-stone/70 bg-white/50 px-6 py-14 text-center">
        <p className="m-0 font-serif text-[28px] text-ink">No replies yet</p>
        <p className="m-0 mx-auto mt-2 max-w-md text-muted">When your guests reply to your invitation, their answers will appear here.</p>
      </div>
    );
  }
  return (
    <div className="rounded-[18px] border border-dashed border-stone/70 bg-white/50 px-6 py-14 text-center">
      <p className="m-0 font-serif text-[28px] text-ink">No guests match</p>
      <p className="m-0 mt-2 text-muted">{query.q ? `Nobody called “${query.q}” in this list.` : "No replies in this list yet."}</p>
      <Link href={dashboardHref(slug)} scroll={false} className="mt-4 inline-block text-sm font-medium text-olive">
        Show all replies
      </Link>
    </div>
  );
}
