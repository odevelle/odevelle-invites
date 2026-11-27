import { type NextRequest } from "next/server";
import { allResponses, getCoupleInvitation, getMealOptions } from "@/dashboard/data";
import { csvFilename, rsvpCsv } from "@/dashboard/csv";
import { parseDashboardQuery } from "@/dashboard/query";
import { getCouple } from "@/lib/auth/session";

/*
 * CSV export of one invitation's replies (all, or the current filter and
 * search). Generated on the server as the signed-in couple, so RLS applies
 * exactly as on the dashboard: another couple's slug is a 404, never data.
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const private_ = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

  if (!(await getCouple())) {
    return Response.redirect(new URL(`/login?next=${encodeURIComponent(`/dashboard/${slug}`)}`, request.url), 303);
  }
  const invitation = await getCoupleInvitation(slug);
  if (!invitation) return new Response("Not found", { status: 404, headers: private_ });

  const query = parseDashboardQuery(Object.fromEntries(request.nextUrl.searchParams));
  const [rows, mealOptions] = await Promise.all([allResponses(invitation.id, query.status, query.q), getMealOptions(invitation.id)]);
  const csv = rsvpCsv(rows, { timeZone: invitation.timeZone, includeMeal: mealOptions.length > 0 || rows.some((r) => r.meal_preference) });

  return new Response(csv, {
    headers: {
      ...private_,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename(invitation.slug, query.status)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
