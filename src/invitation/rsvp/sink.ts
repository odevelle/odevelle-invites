import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { getSupabaseSecretEnv } from "@/lib/env";
import type { RsvpSubmission } from "./schema";
import { createSupabaseRsvpSink } from "./supabase-sink";

/**
 * Where RSVPs are written. Mirrors the read side (src/invitation/source.ts):
 *   ENABLE_INVITATION_FIXTURES=true  → memory (E2E tests, demos): accepted, not stored
 *   SUPABASE_URL set                 → Supabase submit_rsvp(), with the SECRET key
 *   development without Supabase     → memory
 *   production without Supabase      → unavailable
 */
export type RsvpWrite = RsvpSubmission & {
  slug: string;
  /** HMAC of the guest's IP, for rate limiting. The raw IP is never stored. */
  ipHash: string | null;
};

export type RsvpWriteResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "rate-limited" | "full" | "invalid" | "unavailable" };

export type RsvpSink = {
  submit(write: RsvpWrite): Promise<RsvpWriteResult>;
  /** Keyed hash of an IP, scoped to one invitation so hashes can't be linked across couples. */
  hashIp(ip: string, invitationId: string): string;
};

const hmac = (key: Buffer, value: string) => createHmac("sha256", key).update(value).digest("hex");

function memorySink(): RsvpSink {
  const key = randomBytes(32);
  return {
    async submit(write) {
      if (process.env.NODE_ENV !== "production") {
        console.info(`[rsvp] ${write.slug}: reply from "${write.guestName}" accepted (fixtures: not stored)`);
      }
      return { ok: true };
    },
    hashIp: (ip, invitationId) => hmac(key, `${invitationId}:${ip}`),
  };
}

const unavailableSink: RsvpSink = {
  submit: async () => ({ ok: false, reason: "unavailable" }),
  hashIp: () => "",
};

let fixtures: RsvpSink | undefined;
let supabase: RsvpSink | undefined;

export function getRsvpSink(): RsvpSink {
  if (process.env.ENABLE_INVITATION_FIXTURES === "true") return (fixtures ??= memorySink());
  if (process.env.SUPABASE_URL) {
    if (!process.env.SUPABASE_SECRET_KEY) {
      console.error("[rsvp] SUPABASE_SECRET_KEY is not set: RSVPs can't be saved");
      return unavailableSink;
    }
    const { SUPABASE_URL, SUPABASE_SECRET_KEY } = getSupabaseSecretEnv();
    // A key for IP hashes derived from the secret key: stable across instances, useless on its own.
    const ipKey = createHmac("sha256", SUPABASE_SECRET_KEY).update("odevelle:rsvp-ip:v1").digest();
    return (supabase ??= {
      ...createSupabaseRsvpSink({ url: SUPABASE_URL, secretKey: SUPABASE_SECRET_KEY }),
      hashIp: (ip, invitationId) => hmac(ipKey, `${invitationId}:${ip}`),
    });
  }
  return process.env.NODE_ENV !== "production" ? (fixtures ??= memorySink()) : unavailableSink;
}
