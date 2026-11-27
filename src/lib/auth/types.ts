/*
 * What the login form and its Server Actions exchange. Shared with the browser.
 *
 * Sign-in is passwordless: Supabase Auth emails a one-time code and link
 * (docs/auth.md). Accounts exist only for couples the studio has set up.
 */

export type SignInState =
  | { step: "email"; error?: string; email?: string }
  /** `sentAt` (ms) drives the resend cooldown. `notice` confirms a resend. */
  | { step: "code"; email: string; sentAt: number; error?: string; notice?: string };

/** Supabase's minimum gap between two codes for one address (Auth → Rate limits). */
export const RESEND_COOLDOWN_SECONDS = 60;
