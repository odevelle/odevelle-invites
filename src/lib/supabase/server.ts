import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Supabase as the signed-in couple: the PUBLISHABLE key plus their session
 * cookie, so every query runs as `authenticated` under RLS. The secret key is
 * never used for anything a couple reads.
 *
 * Server Components can't write cookies; a refreshed session is written by
 * proxy.ts (lib/supabase/proxy.ts) instead, and by Server Actions and Route
 * Handlers, which can.
 */
export async function createSupabaseServerClient() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getSupabasePublicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy has already refreshed the session.
        }
      },
    },
  });
}
