import "server-only";
import { cache } from "react";
import { RSVP_RESPONSE_COLUMNS, type RsvpResponseRow } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { likePattern, PAGE_SIZE, type DashboardQuery, type StatusFilter } from "./query";

/*
 * Dashboard reads, all as the signed-in couple through RLS (publishable key +
 * session). Nothing here can see another couple's rows: the database refuses,
 * whatever id or slug is asked for. Failures throw, so the route's error
 * boundary shows "try again" rather than an empty, misleading dashboard.
 */

export type CoupleInvitation = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  primaryDate: string | null;
  timeZone: string;
};

export type RsvpSummary = { total: number; attending: number; declined: number; guests: number };

export type ResponsePage = { rows: RsvpResponseRow[]; total: number; page: number; pageCount: number };

const RESPONSE_COLUMNS = RSVP_RESPONSE_COLUMNS.join(", ") as "id, invitation_id, guest_name, attending, party_size, meal_preference, message, submitted_at, same_name_count";

function fail(what: string, error: { code?: string; message: string }): never {
  throw new Error(`Dashboard: ${what} failed (${error.code ?? "unknown"}): ${error.message}`);
}

/** Every invitation this couple owns (a couple can buy several), soonest first. Once per request. */
export const listCoupleInvitations = cache(async (): Promise<CoupleInvitation[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, slug, title, status, primary_date, time_zone")
    .order("primary_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) fail("listing invitations", error);
  return data.map((i) => ({ id: i.id, slug: i.slug, title: i.title, status: i.status, primaryDate: i.primary_date, timeZone: i.time_zone }));
});

/** One of the couple's invitations by slug; null if it isn't theirs (or doesn't exist: indistinguishable on purpose). */
export async function getCoupleInvitation(slug: string): Promise<CoupleInvitation | null> {
  return (await listCoupleInvitations()).find((i) => i.slug === slug) ?? null;
}

export async function getMealOptions(invitationId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("rsvp_settings").select("meal_options").eq("invitation_id", invitationId).maybeSingle();
  if (error) fail("reading RSVP settings", error);
  return data?.meal_options ?? [];
}

/** The four headline figures, in one aggregate query (rsvp_summary). */
export async function getRsvpSummary(invitationId: string): Promise<RsvpSummary> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rsvp_summary", { p_invitation_id: invitationId });
  if (error) fail("summarising replies", error);
  return data[0] ?? { total: 0, attending: 0, declined: 0, guests: 0 };
}

function filtered(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, invitationId: string, status: StatusFilter, q: string, count?: "exact") {
  let query = supabase.from("rsvp_responses").select(RESPONSE_COLUMNS, count ? { count } : undefined).eq("invitation_id", invitationId);
  if (status !== "all") query = query.eq("attending", status === "attending");
  if (q) query = query.ilike("guest_name", likePattern(q));
  // Newest first; id breaks ties so pages never overlap or skip.
  return query.order("submitted_at", { ascending: false }).order("id", { ascending: false });
}

/** One page of replies for the table, with the filtered total for paging. */
export async function listResponses(invitationId: string, query: DashboardQuery): Promise<ResponsePage> {
  const supabase = await createSupabaseServerClient();
  const from = (query.page - 1) * PAGE_SIZE;
  const { data, error, count } = await filtered(supabase, invitationId, query.status, query.q, "exact").range(from, from + PAGE_SIZE - 1);
  // Asking for a page past the end (e.g. after deleting replies) is an empty page, not an error.
  if (error && error.code !== "PGRST103") fail("listing replies", error);
  const total = count ?? 0;
  return { rows: data ?? [], total, page: query.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** One reply, for the details panel when it isn't on the current page. */
export async function getResponse(invitationId: string, id: string): Promise<RsvpResponseRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("rsvp_responses").select(RESPONSE_COLUMNS).eq("invitation_id", invitationId).eq("id", id).maybeSingle();
  if (error) fail("reading a reply", error);
  return data;
}

/** Every matching reply, for the CSV export, in batches (the Data API returns at most 1,000 rows per request). */
export async function allResponses(invitationId: string, status: StatusFilter, q: string): Promise<RsvpResponseRow[]> {
  const supabase = await createSupabaseServerClient();
  const batch = 1000;
  const rows: RsvpResponseRow[] = [];
  for (let from = 0; ; from += batch) {
    const { data, error } = await filtered(supabase, invitationId, status, q).range(from, from + batch - 1);
    if (error) fail("exporting replies", error);
    rows.push(...data);
    if (data.length < batch) return rows;
  }
}
