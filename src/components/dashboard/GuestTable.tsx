import Link from "next/link";
import { formatSubmittedAt, guestsLabel } from "@/dashboard/format";
import { dashboardHref, type DashboardQuery } from "@/dashboard/query";
import type { RsvpResponseRow } from "@/lib/supabase/database.types";
import { AttendanceBadge, DuplicateHint } from "./AttendanceBadge";

/**
 * The replies: a table from tablet width up, a list of cards on phones. Each
 * reply links to its full details (?guest=…), so it's keyboard-reachable and
 * the open reply survives a refresh.
 */
export function GuestTable({
  slug,
  query,
  rows,
  timeZone,
  showMeal,
}: {
  slug: string;
  query: DashboardQuery;
  rows: RsvpResponseRow[];
  timeZone: string;
  showMeal: boolean;
}) {
  const href = (id: string) => dashboardHref(slug, { ...query, guest: id });

  return (
    <>
      <div className="hidden overflow-hidden rounded-[18px] border border-linen bg-white/70 md:block">
        <table className="w-full border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-linen text-xs uppercase tracking-[.14em] text-muted">
              <th scope="col" className="px-5 py-3.5 font-medium">Guest name</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Attendance</th>
              <th scope="col" className="px-4 py-3.5 text-right font-medium">Guests</th>
              {showMeal && <th scope="col" className="px-4 py-3.5 font-medium">Meal</th>}
              <th scope="col" className="px-4 py-3.5 font-medium">Message</th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="group relative border-b border-linen/70 last:border-b-0 hover:bg-sand/60 has-focus-visible:bg-sand/60">
                <td className="px-5 py-4 align-top">
                  <Link
                    href={href(r.id)}
                    scroll={false}
                    className="font-medium text-ink no-underline outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
                  >
                    {r.guest_name}
                  </Link>
                  {r.same_name_count > 1 && (
                    <div className="mt-0.5">
                      <DuplicateHint />
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <AttendanceBadge attending={r.attending} />
                </td>
                <td className="px-4 py-4 text-right align-top tabular-nums">{r.attending ? r.party_size : <span className="text-stone">–</span>}</td>
                {showMeal && <td className="px-4 py-4 align-top text-muted">{r.meal_preference ?? <span className="text-stone">–</span>}</td>}
                <td className="max-w-[320px] px-4 py-4 align-top text-muted">
                  {r.message ? <span className="line-clamp-2">{r.message}</span> : <span className="text-stone">–</span>}
                </td>
                <td className="px-5 py-4 text-right align-top text-sm whitespace-nowrap text-muted tabular-nums">{formatSubmittedAt(r.submitted_at, timeZone)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="m-0 grid list-none gap-3 p-0 md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={href(r.id)} scroll={false} className="block rounded-2xl border border-linen bg-white/70 p-4 text-ink no-underline active:bg-sand/60">
              <div className="flex items-start justify-between gap-3">
                <span className="font-medium">{r.guest_name}</span>
                <AttendanceBadge attending={r.attending} />
              </div>
              <p className="m-0 mt-1 text-sm text-muted">
                {[r.attending ? guestsLabel(r.party_size) : null, showMeal ? r.meal_preference : null, formatSubmittedAt(r.submitted_at, timeZone)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {r.message && <p className="m-0 mt-2 line-clamp-2 text-sm text-ink/80">“{r.message}”</p>}
              {r.same_name_count > 1 && (
                <div className="mt-2">
                  <DuplicateHint />
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
