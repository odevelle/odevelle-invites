/*
 * Whether couple sign-in can work: a Supabase project is configured. Read
 * straight from process.env (not lib/env.ts, which is server-only) because
 * proxy.ts needs it too. Values are validated where clients are created.
 */
export function supabaseAuthConfig(): { url: string; publishableKey: string } | null {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

/** Account pages: the only paths whose requests carry and refresh the sign-in cookies. */
export const ACCOUNT_PATH = /^\/(?:dashboard|login|auth)(?:\/|$)/;
