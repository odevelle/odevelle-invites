import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountFrame, AccountHeading } from "@/components/account/AccountFrame";
import { LoginForm, type LoginNotice } from "@/components/account/LoginForm";
import { safeDashboardPath } from "@/lib/auth/redirect";
import { getCouple } from "@/lib/auth/session";
import { supabaseAuthConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in · Couple Dashboard · ODEVELLE" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AccountFrame>
      <AccountHeading eyebrow="Couple Dashboard" title="Welcome back">
        Sign in to see your guests’ replies. We’ll email you a one-time code, so there’s no password to remember.
      </AccountHeading>
      {/* Reading the session and the URL happens at request time, inside the boundary. */}
      <Suspense fallback={<div className="h-[178px]" aria-hidden="true" />}>
        <SignIn searchParams={searchParams} />
      </Suspense>
    </AccountFrame>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeDashboardPath(first(params.next));
  // Already signed in: straight to the dashboard.
  if (await getCouple()) redirect(next);

  let notice: LoginNotice | undefined;
  if (!supabaseAuthConfig()) notice = { tone: "error", text: "Sign-in isn’t available just now. Please try again shortly." };
  else if (first(params.error) === "link") notice = { tone: "error", text: "That sign-in link has expired or has already been used. Enter your email for a new code." };
  else if (first(params.error) === "unavailable") notice = { tone: "error", text: "Sign-in isn’t available just now. Please try again shortly." };
  else if (first(params["signed-out"])) notice = { tone: "info", text: "You’ve been signed out." };

  return <LoginForm next={next} notice={notice} />;
}
