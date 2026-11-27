import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getCoupleInvitation, getMealOptions, getResponse, getRsvpSummary, listCoupleInvitations, listResponses } from "@/dashboard/data";
import { formatSubmittedAt } from "@/dashboard/format";
import { parseDashboardQuery } from "@/dashboard/query";
import { requireCouple } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Guest replies · Couple Dashboard · ODEVELLE" };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function InvitationDashboardPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <InvitationDashboard params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function InvitationDashboard({ params, searchParams }: Props) {
  const { slug } = await params;
  const couple = await requireCouple(`/dashboard/${slug}`);
  const query = parseDashboardQuery(await searchParams);

  // RLS returns only this couple's invitations: anyone else's slug is simply not found.
  const [invitations, invitation] = await Promise.all([listCoupleInvitations(), getCoupleInvitation(slug)]);
  if (!invitation) notFound();

  const [summary, page, mealOptions] = await Promise.all([
    getRsvpSummary(invitation.id),
    listResponses(invitation.id, query),
    getMealOptions(invitation.id),
  ]);
  const showMeal = mealOptions.length > 0 || page.rows.some((r) => r.meal_preference);
  const selected = query.guest ? (page.rows.find((r) => r.id === query.guest) ?? (await getResponse(invitation.id, query.guest))) : null;

  return (
    <DashboardView
      email={couple.email}
      invitations={invitations}
      invitation={invitation}
      query={query}
      summary={summary}
      page={page}
      showMeal={showMeal}
      selected={selected}
      updatedAt={formatSubmittedAt(new Date().toISOString(), invitation.timeZone).split(", ")[1]}
    />
  );
}
