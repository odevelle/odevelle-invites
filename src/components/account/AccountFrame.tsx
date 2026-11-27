import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkle } from "../marketing/icons";

/** The centred card used by the sign-in pages: wordmark, a quiet card, a way back to the site. */
export function AccountFrame({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center px-5 py-10 sm:justify-center sm:py-16">
      <Link href="/" aria-label="ODEVELLE home" className="mb-8 flex items-center gap-2.5 text-ink no-underline sm:mb-10">
        <Sparkle size={18} />
        <span className="font-serif text-[19px] tracking-[.3em]">ODEVELLE</span>
      </Link>
      <div className="w-full max-w-[440px] rounded-[20px] border border-linen bg-white/70 px-6 py-9 shadow-[0_24px_60px_-40px_rgba(31,36,32,.35)] sm:px-10 sm:py-11">
        {children}
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Need help signing in?{" "}
        <Link href="/#begin" className="text-olive underline underline-offset-4">
          Contact the studio
        </Link>
      </p>
    </main>
  );
}

export function AccountHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-7 text-center">
      {eyebrow && <p className="m-0 mb-3 text-xs font-medium uppercase tracking-[.22em] text-olive">{eyebrow}</p>}
      <h1 className="m-0 font-serif text-[40px] leading-[1.05] font-medium text-gold">{title}</h1>
      {children && <div className="mt-3 text-[15px] text-muted">{children}</div>}
    </div>
  );
}
