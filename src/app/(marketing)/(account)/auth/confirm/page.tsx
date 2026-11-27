import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountFrame, AccountHeading } from "@/components/account/AccountFrame";
import { SubmitButton } from "@/components/account/SubmitButton";
import { button } from "@/components/marketing/ui";
import { confirmSignInLink } from "@/lib/auth/actions";
import { safeDashboardPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Continue to your dashboard · ODEVELLE" };

/*
 * Where the link in the sign-in email lands. The one-time token is used only
 * when the couple presses the button (a Server Action, POST), never on load:
 * email security scanners open links on their own and would otherwise use the
 * token up first.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function ConfirmPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AccountFrame>
      <AccountHeading eyebrow="Couple Dashboard" title="You’re nearly in">
        Continue to see your guests’ replies.
      </AccountHeading>
      <Suspense fallback={<div className="h-12" aria-hidden="true" />}>
        <Continue searchParams={searchParams} />
      </Suspense>
    </AccountFrame>
  );
}

async function Continue({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tokenHash = first(params.token_hash).slice(0, 200);
  const code = first(params.code).slice(0, 200);
  if (!tokenHash && !code) redirect("/login?error=link");

  return (
    <form action={confirmSignInLink}>
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={first(params.type).slice(0, 20)} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="next" value={safeDashboardPath(first(params.next))} />
      <SubmitButton pendingLabel="Signing you in…" className={button("primary", "min-h-12 w-full px-6 text-[15px] font-medium")}>
        Continue to my dashboard
      </SubmitButton>
    </form>
  );
}
