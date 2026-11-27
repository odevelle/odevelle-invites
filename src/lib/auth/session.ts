import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAuthConfig } from "@/lib/supabase/config";

/*
 * The couple dashboard's Data Access Layer for identity. Reading the session
 * makes a render dynamic, so callers sit behind <Suspense> (cacheComponents).
 *
 * This is a convenience check for pages. The real boundary is the database:
 * every dashboard query runs as this user under RLS, so even a forged or
 * stale session can only ever read that user's own invitations.
 */

export type Couple = { userId: string; email: string | null };

/** The signed-in couple, or null. Verifies the session token (getClaims). Once per request. */
export const getCouple = cache(async (): Promise<Couple | null> => {
  if (!supabaseAuthConfig()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { userId: data.claims.sub, email: typeof data.claims.email === "string" ? data.claims.email : null };
});

/** The signed-in couple, or a redirect to the login page. */
export async function requireCouple(next?: string): Promise<Couple> {
  const couple = await getCouple();
  if (!couple) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return couple;
}
