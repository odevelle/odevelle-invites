import { createClient } from "@supabase/supabase-js";
import type { RsvpWrite, RsvpWriteResult } from "./sink";

/*
 * Writes an RSVP through submit_rsvp() with the SECRET key. That function is
 * the only write path and isn't executable with the public key.
 *
 * No `server-only` import so tests can run it with a fake fetch; it's only
 * reached through sink.ts, which is server-only.
 */

export type SupabaseRsvpSinkConfig = { url: string; secretKey: string; fetch?: typeof fetch };

export function createSupabaseRsvpSink(config: SupabaseRsvpSinkConfig): { submit(write: RsvpWrite): Promise<RsvpWriteResult> } {
  const client = createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: config.fetch ? { fetch: config.fetch } : undefined,
  });

  return {
    async submit(write) {
      const { error } = await client.rpc("submit_rsvp", {
        p_slug: write.slug,
        p_client_submission_id: write.submissionId ?? null,
        p_guest_name: write.guestName,
        p_attending: write.attending,
        p_party_size: write.partySize,
        p_meal: write.meal ?? null,
        p_message: write.message ?? null,
        p_ip_hash: write.ipHash,
      });
      if (!error) return { ok: true };
      return { ok: false, reason: reasonFor(error) };
    },
  };
}

/** Maps a database error to what the guest is told. Unknown failures are logged, never shown. */
function reasonFor(error: { code?: string; message: string }): Exclude<RsvpWriteResult, { ok: true }>["reason"] {
  const message = error.message ?? "";
  if (message.startsWith("rsvp:not_found")) return "not-found";
  if (message.startsWith("rsvp:rate_limited")) return "rate-limited";
  if (message.startsWith("rsvp:full")) return "full";
  // Our own checks, column constraints (23514) and bad casts (22P02).
  if (message.startsWith("rsvp:invalid") || ["22023", "22P02", "23514", "23505", "23503"].includes(error.code ?? "")) {
    return "invalid";
  }
  console.error(`[rsvp] submit_rsvp failed (${error.code ?? "unknown"}): ${message}`);
  return "unavailable";
}
