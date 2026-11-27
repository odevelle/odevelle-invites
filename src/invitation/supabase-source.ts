import { createClient } from "@supabase/supabase-js";
import type { InvitationSource } from "./source";

/*
 * Invitation data from Supabase.
 *
 * Reads use the PUBLISHABLE key, so they run as Postgres `anon`: RLS gives
 * that role no table access, only get_published_invitation(), which returns
 * a published, unlisted invitation without client details or RSVPs. The
 * secret key is never needed to show an invitation.
 *
 * No `server-only` import so unit tests can run it with a fake fetch; it's
 * only reached through source.ts, which is server-only.
 */

export const MEDIA_BUCKET = "invitation-media";

export type SupabaseSourceConfig = {
  url: string;
  publishableKey: string;
  fetch?: typeof fetch;
};

/** Public CDN URL of an object in the invitation-media bucket. Each path segment is encoded. */
export function storagePublicUrl(supabaseUrl: string, path: string): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}

export function createSupabaseSource(config: SupabaseSourceConfig): InvitationSource {
  const client = createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: config.fetch ? { fetch: config.fetch } : undefined,
  });

  return {
    async getPublishedRecord(slug) {
      const { data, error } = await client.rpc("get_published_invitation", { p_slug: slug });
      // Thrown, not swallowed: an outage must not look like "invitation not found"
      // (and isn't cached as one). The route's error boundary handles it.
      if (error) throw new Error(`Supabase: get_published_invitation failed (${error.code ?? "unknown"}): ${error.message}`);
      return (data as unknown) ?? null;
    },
    mediaUrl: (path) => storagePublicUrl(config.url, path),
  };
}
