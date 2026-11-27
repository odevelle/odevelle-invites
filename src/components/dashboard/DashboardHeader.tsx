import Link from "next/link";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Sparkle } from "@/components/marketing/icons";
import { signOut } from "@/lib/auth/actions";
import type { CoupleInvitation } from "@/dashboard/data";
import { InvitationSwitcher } from "./InvitationSwitcher";

/** The dashboard's top bar: wordmark, invitation switcher (couples with several), account and sign out. */
export function DashboardHeader({
  email,
  invitations,
  current,
}: {
  email: string | null;
  invitations: CoupleInvitation[];
  current?: string;
}) {
  return (
    <header className="border-b border-ink/8 bg-[rgba(247,245,239,.94)]">
      <div className="shell flex min-h-17 flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
        <Link href="/dashboard" aria-label="Couple Dashboard home" className="flex items-center gap-2.5 text-ink no-underline">
          <Sparkle size={16} />
          <span className="font-serif text-[17px] tracking-[.3em]">ODEVELLE</span>
          <span className="hidden border-l border-ink/15 pl-3 text-xs font-medium uppercase tracking-[.22em] text-olive sm:inline">Couple Dashboard</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {current && invitations.length > 1 && <InvitationSwitcher invitations={invitations.map(({ slug, title }) => ({ slug, title }))} current={current} />}
          {email && <span className="hidden max-w-[240px] truncate text-sm text-muted md:inline" title={email}>{email}</span>}
          <form action={signOut}>
            <SubmitButton
              pendingLabel="Signing out…"
              className="min-h-10 cursor-pointer rounded-full border border-ink/20 bg-transparent px-4 text-sm text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
