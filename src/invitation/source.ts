import "server-only";
import { getSupabasePublicEnv } from "@/lib/env";
import { fixtureSource } from "./fixtures";
import { createSupabaseSource } from "./supabase-source";
import type { MediaUrlResolver } from "./view";

/**
 * Where published invitation records come from. Returns raw JSON in the
 * shape of get_published_invitation(); callers validate it.
 */
export type InvitationSource = {
  getPublishedRecord(slug: string): Promise<unknown>;
  mediaUrl: MediaUrlResolver;
};

const emptySource: InvitationSource = {
  getPublishedRecord: async () => null,
  mediaUrl: (path) => path,
};

let supabaseSource: InvitationSource | undefined;

/**
 *   ENABLE_INVITATION_FIXTURES=true  → fixtures (E2E tests, demos), even when Supabase is configured
 *   SUPABASE_URL set                 → Supabase
 *   development without Supabase     → fixtures
 *   production without Supabase      → nothing (every slug is not found)
 */
export function getInvitationSource(): InvitationSource {
  if (process.env.ENABLE_INVITATION_FIXTURES === "true") return fixtureSource;
  if (process.env.SUPABASE_URL) {
    const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getSupabasePublicEnv();
    return (supabaseSource ??= createSupabaseSource({ url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY }));
  }
  return process.env.NODE_ENV !== "production" ? fixtureSource : emptySource;
}
