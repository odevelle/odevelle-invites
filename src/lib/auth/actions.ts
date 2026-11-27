"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAuthConfig } from "@/lib/supabase/config";
import { safeDashboardPath } from "./redirect";
import type { SignInState } from "./types";

/*
 * Couple sign-in: Supabase Auth email OTP. One email carries both a 6-digit
 * code and a link (template: supabase/templates/magic-link.html).
 *
 *   - shouldCreateUser: false, and sign-ups are off in the project: an email
 *     the studio hasn't set up never gets an account.
 *   - The reply is the same whether or not the address has an account, so the
 *     form can't be used to find out who's a customer.
 */

const email = z.string().trim().toLowerCase().pipe(z.email("Please enter the email address you gave us")).pipe(z.string().max(254));
const code = z
  .string()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{6,10}$/, "Please enter the code from your email"));

const unavailable = "Sign-in isn’t available just now. Please try again shortly.";

type AuthError = { code?: string; status?: number; message: string };

const isRateLimited = (e: AuthError) => e.status === 429 || /rate_limit/.test(e.code ?? "");
/** What Supabase answers for an address with no account when sign-ups are off. Treated as sent. */
const isUnknownAccount = (e: AuthError) =>
  ["otp_disabled", "signup_disabled", "user_not_found", "email_address_not_authorized"].includes(e.code ?? "") ||
  /signups not allowed/i.test(e.message);

async function confirmUrl(next: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  // Supabase only sends links to URLs on the project's Redirect URLs allow-list.
  return `${proto}://${host}/auth/confirm?next=${encodeURIComponent(next)}`;
}

/**
 * The login form's one action, by `intent`:
 *   send / resend  email a sign-in code and link
 *   verify         check the code and sign in (redirects to the dashboard)
 *   change-email   back to step 1
 */
export async function signIn(previous: SignInState, formData: FormData): Promise<SignInState> {
  switch (formData.get("intent")) {
    case "verify":
      return verifySignInCode(previous, formData);
    case "change-email":
      return { step: "email", email: previous.email };
    default:
      return sendSignInCode(formData);
  }
}

async function sendSignInCode(formData: FormData): Promise<SignInState> {
  const parsed = email.safeParse(formData.get("email") ?? "");
  const typed = String(formData.get("email") ?? "").slice(0, 254);
  if (!parsed.success) return { step: "email", email: typed, error: parsed.error.issues[0]?.message };
  const resend = formData.get("resend") === "1";
  const fail = (error: string): SignInState =>
    resend ? { step: "code", email: parsed.data, sentAt: 0, error } : { step: "email", email: parsed.data, error };

  if (!supabaseAuthConfig()) return fail(unavailable);

  const supabase = await createSupabaseServerClient();
  const next = safeDashboardPath(String(formData.get("next") ?? ""));
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: await confirmUrl(next) },
  });

  if (error && !isUnknownAccount(error)) {
    if (isRateLimited(error)) return fail("We’ve just sent a code. Please wait a minute before asking for another.");
    console.error(`[auth] signInWithOtp failed (${error.code ?? error.status ?? "unknown"}): ${error.message}`);
    return fail("We couldn’t send your code just now. Please try again in a moment.");
  }
  return {
    step: "code",
    email: parsed.data,
    sentAt: Date.now(),
    notice: resend ? "A new code is on its way." : undefined,
  };
}

async function verifySignInCode(previous: SignInState, formData: FormData): Promise<SignInState> {
  if (previous.step !== "code") return previous;
  const sentAt = previous.sentAt;
  const address = email.safeParse(formData.get("email") ?? "");
  const token = code.safeParse(formData.get("code") ?? "");
  if (!address.success) return { step: "email", error: "Please enter your email address again." };
  if (!token.success) return { step: "code", email: address.data, sentAt, error: token.error.issues[0]?.message };
  if (!supabaseAuthConfig()) return { step: "code", email: address.data, sentAt, error: unavailable };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ email: address.data, token: token.data, type: "email" });
  if (error) {
    const message =
      error.code === "otp_expired"
        ? "That code has expired or has already been used. Please request a new one."
        : isRateLimited(error)
          ? "Too many attempts. Please wait a few minutes and try again."
          : "That code didn’t work. Please check it, or request a new one.";
    return { step: "code", email: address.data, sentAt, error: message };
  }
  redirect(safeDashboardPath(String(formData.get("next") ?? "")));
}

/**
 * The link in the email. Verified only when the couple presses "Continue",
 * never on a plain GET: email security scanners open links automatically and
 * would otherwise use up the one-time token before the couple does.
 */
export async function confirmSignInLink(formData: FormData): Promise<void> {
  const next = safeDashboardPath(String(formData.get("next") ?? ""));
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "");
  const pkceCode = String(formData.get("code") ?? "");
  if (!supabaseAuthConfig()) redirect("/login?error=unavailable");

  const supabase = await createSupabaseServerClient();
  let ok = false;
  if (tokenHash && (type === "email" || type === "magiclink")) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  } else if (pkceCode) {
    // Supabase's default email template (PKCE): only works in the browser that asked for the code.
    ok = !(await supabase.auth.exchangeCodeForSession(pkceCode)).error;
  }
  redirect(ok ? next : "/login?error=link");
}

export async function signOut(): Promise<void> {
  if (supabaseAuthConfig()) {
    const supabase = await createSupabaseServerClient();
    // This device only: a partner signed in elsewhere stays signed in.
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/login?signed-out=1");
}
