"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signIn } from "@/lib/auth/actions";
import { RESEND_COOLDOWN_SECONDS, type SignInState } from "@/lib/auth/types";
import { button } from "../marketing/ui";

/*
 * Passwordless sign-in in two steps: email → the 6-digit code (or the link in
 * the same email). One Server Action (signIn) handles every step by `intent`.
 */

const initial: SignInState = { step: "email" };

const input =
  "min-h-12 w-full rounded-xl border border-ink/20 bg-white px-4 text-base text-ink outline-none transition-colors placeholder:text-placeholder focus-visible:border-olive focus-visible:ring-2 focus-visible:ring-olive/20 aria-invalid:border-[#a3412f]";
const label = "mb-2 block text-sm font-medium text-ink";
const primary = button("primary", "min-h-12 w-full gap-2 px-6 text-[15px] font-medium disabled:cursor-progress disabled:opacity-70");
const textButton = "cursor-pointer border-0 bg-transparent p-0 text-sm text-olive underline underline-offset-4 disabled:cursor-not-allowed disabled:text-stone disabled:no-underline";

export type LoginNotice = { tone: "info" | "error"; text: string };

export function LoginForm({ next, notice }: { next: string; notice?: LoginNotice }) {
  const [state, action, pending] = useActionState(signIn, initial);
  // Server notices (expired link, signed out) only until the couple does something.
  const shownNotice = state === initial ? notice : undefined;

  if (state.step === "email") {
    return (
      <form action={action} className="grid gap-5" aria-busy={pending}>
        {shownNotice && <Notice notice={shownNotice} />}
        <input type="hidden" name="intent" value="send" />
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="login-email" className={label}>
            Email address
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            placeholder="you@example.com"
            defaultValue={state.email}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "login-email-error" : "login-email-hint"}
            className={input}
          />
          {state.error ? (
            <p id="login-email-error" role="alert" className="mt-2 mb-0 text-sm text-[#a3412f]">
              {state.error}
            </p>
          ) : (
            <p id="login-email-hint" className="mt-2 mb-0 text-sm text-muted">
              The address you gave us when you ordered your invitation.
            </p>
          )}
        </div>
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Sending your code…" : "Email me a sign-in code"}
        </button>
      </form>
    );
  }

  return <CodeStep state={state} action={action} pending={pending} next={next} />;
}

function CodeStep({
  state,
  action,
  pending,
  next,
}: {
  state: Extract<SignInState, { step: "code" }>;
  action: (formData: FormData) => void;
  pending: boolean;
  next: string;
}) {
  const codeRef = useRef<HTMLInputElement>(null);
  // Focus the code field when this step appears, and again after a wrong code.
  useEffect(() => codeRef.current?.focus(), [state]);

  return (
    <div className="grid gap-6">
      <p className="m-0 text-center text-[15px] text-muted" role="status">
        {state.notice ?? "If this address is registered with us, a sign-in code is on its way to"}
        {!state.notice && (
          <>
            {" "}
            <strong className="font-medium break-all text-ink">{state.email}</strong>.
          </>
        )}
      </p>

      <form action={action} className="grid gap-5" aria-busy={pending}>
        <input type="hidden" name="intent" value="verify" />
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="login-code" className={label}>
            Sign-in code
          </label>
          <input
            ref={codeRef}
            id="login-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={12}
            required
            placeholder="123456"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "login-code-error" : "login-code-hint"}
            className={`${input} text-center text-xl tracking-[.35em]`}
          />
          {state.error ? (
            <p id="login-code-error" role="alert" className="mt-2 mb-0 text-sm text-[#a3412f]">
              {state.error}
            </p>
          ) : (
            <p id="login-code-hint" className="mt-2 mb-0 text-sm text-muted">
              Or simply tap the link in the same email.
            </p>
          )}
        </div>
        <button type="submit" disabled={pending} className={primary}>
          {pending ? "Signing you in…" : "Sign in"}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-linen pt-5">
        <form action={action}>
          <input type="hidden" name="intent" value="resend" />
          <input type="hidden" name="resend" value="1" />
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={next} />
          <ResendButton key={state.sentAt} sentAt={state.sentAt} pending={pending} />
        </form>
        <form action={action}>
          <input type="hidden" name="intent" value="change-email" />
          <button type="submit" disabled={pending} className={textButton}>
            Use a different email
          </button>
        </form>
      </div>
      <p className="m-0 text-center text-xs text-muted">Not arriving? Check your spam folder. Each code works once and expires after an hour.</p>
    </div>
  );
}

/** Counts down from the moment a code was sent (Supabase allows one code a minute per address). */
function ResendButton({ sentAt, pending }: { sentAt: number; pending: boolean }) {
  const [left, setLeft] = useState(sentAt ? RESEND_COOLDOWN_SECONDS : 0);
  useEffect(() => {
    if (!sentAt) return;
    const timer = setInterval(() => setLeft((s) => (s <= 1 ? (clearInterval(timer), 0) : s - 1)), 1000);
    return () => clearInterval(timer);
  }, [sentAt]);
  return (
    <button type="submit" disabled={pending || left > 0} className={textButton}>
      {left > 0 ? `Resend code in 0:${String(left).padStart(2, "0")}` : "Resend code"}
    </button>
  );
}

function Notice({ notice }: { notice: LoginNotice }) {
  return (
    <p
      role={notice.tone === "error" ? "alert" : "status"}
      className={`m-0 rounded-xl px-4 py-3 text-sm ${notice.tone === "error" ? "bg-[#f8e9e5] text-[#7d2f22]" : "bg-sage-wash text-olive-deep"}`}
    >
      {notice.text}
    </p>
  );
}
