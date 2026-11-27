import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { listCoupleInvitations } from "@/dashboard/data";
import { formatEventDate } from "@/dashboard/format";
import { requireCouple } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Couple Dashboard · ODEVELLE" };

/** Signed out → login. One invitation → its dashboard. Several → choose. */
export default function DashboardIndexPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ChooseInvitation />
    </Suspense>
  );
}

async function ChooseInvitation() {
  const couple = await requireCouple("/dashboard");
  const invitations = await listCoupleInvitations();
  if (invitations.length === 1) redirect(`/dashboard/${invitations[0].slug}`);

  return (
    <>
      <DashboardHeader email={couple.email} invitations={invitations} />
      <main id="main" className="shell py-10 sm:py-14">
        <p className="m-0 text-xs font-medium uppercase tracking-[.22em] text-olive">Couple Dashboard</p>
        <h1 className="m-0 mt-2 font-serif text-[44px] leading-[1.05] font-medium text-gold">Your invitations</h1>
        {invitations.length === 0 ? (
          <div className="mt-8 max-w-xl rounded-[18px] border border-linen bg-white/70 p-8">
            <p className="m-0 font-serif text-[26px] text-ink">No invitations here yet</p>
            <p className="m-0 mt-2 text-muted">
              We couldn’t find an invitation linked to {couple.email ?? "this email address"}. If you’ve ordered one, please{" "}
              <Link href="/#begin">contact the studio</Link> and we’ll connect it to your account.
            </p>
          </div>
        ) : (
          <ul className="m-0 mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/dashboard/${i.slug}`}
                  className="block h-full rounded-[18px] border border-linen bg-white/70 p-6 text-ink no-underline transition-colors hover:border-olive/40 hover:bg-white"
                >
                  <span className="block font-serif text-[28px] leading-tight font-medium text-gold">{i.title}</span>
                  <span className="mt-2 block text-sm text-muted">
                    {[i.primaryDate && formatEventDate(i.primaryDate), i.status === "draft" ? "Not yet published" : i.status === "archived" ? "Archived" : null]
                      .filter(Boolean)
                      .join(" · ") || "Date to be confirmed"}
                  </span>
                  <span className="mt-5 inline-block text-sm font-medium text-olive">View replies →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
