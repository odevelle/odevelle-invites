import Link from "next/link";
import { footerNav } from "@/content/marketing/navigation";
import { Sparkle } from "./icons";
import { transitionTypesFor } from "./PageTransition";

export function SiteFooter({ currentPath = "/" }: { currentPath?: string }) {
  return (
    <footer className="on-dark bg-ink pt-[clamp(56px,7vw,88px)] pb-8 text-linen">
      <div className="shell">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="max-w-90 flex-[1_1_280px]">
            <p className="m-0 flex items-center gap-2.5 font-serif text-[22px] tracking-[.3em] text-cream">
              <Sparkle size={18} fill="#F3E3A1" />
              ODEVELLE
            </p>
            <p className="mt-4 mb-0 text-[15px] leading-[1.6]">
              Digital wedding invitations, designed by hand. An independent studio, inviting the world.
            </p>
          </div>
          <nav aria-label="Footer" className="grid flex-[2_1_420px] grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-7">
            {footerNav.map((group) => (
              <div key={group.title}>
                <p className="mt-0 mb-3 text-[13px] uppercase tracking-[.18em] text-butter">{group.title}</p>
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        className="link-draw text-linen"
                        href={link.href}
                        transitionTypes={transitionTypesFor(link.href, currentPath)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-[rgba(243,227,161,.18)] pt-5.5 text-[13px] text-butter">
          <p className="m-0">© 2026 ODEVELLE. All rights reserved.</p>
          <p className="m-0">English · [Language 2] · [Language 3]</p>
        </div>
      </div>
    </footer>
  );
}
