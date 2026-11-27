import Link from "next/link";
import { button } from "@/components/marketing/ui";

/** A slug that isn't one of this couple's invitations (whether or not it exists). */
export default function InvitationNotFound() {
  return (
    <main id="main" className="shell grid min-h-[70dvh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <p className="m-0 text-xs font-medium uppercase tracking-[.22em] text-olive">Couple Dashboard</p>
        <h1 className="m-0 mt-3 font-serif text-[40px] leading-tight font-medium text-gold">This invitation isn’t in your account</h1>
        <p className="m-0 mt-3 text-muted">Check that you’re signed in with the email address you gave us when you ordered.</p>
        <Link href="/dashboard" className={button("primary", "mt-6 min-h-11 px-6 text-[15px]")}>
          Back to your invitations
        </Link>
      </div>
    </main>
  );
}
