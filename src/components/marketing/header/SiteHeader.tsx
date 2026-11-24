import Link from "next/link";
import { clientLogin, ctaLinks, primaryNav } from "@/content/marketing/navigation";
import { Sparkle } from "../icons";
import { transitionTypesFor } from "../PageTransition";
import { button } from "../ui";
import { MobileMenu } from "./MobileMenu";

/**
 * Site header shared by every marketing page.
 * The full link row needs ~900px, so it shows from the xl breakpoint (1180px);
 * narrower screens use the menu button.
 * `currentPath` marks the matching nav link with aria-current (e.g. "/features").
 */
export function SiteHeader({ currentPath = "/" }: { currentPath?: string }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        Skip to content
      </a>

      <header
        style={{ viewTransitionName: "site-header" }}
        className="sticky top-0 z-40 border-b border-ink/8 bg-[rgba(247,245,239,.94)] backdrop-blur-sm backdrop-saturate-[1.2]">
        <div className="shell flex h-17 items-center justify-between gap-6">
          <Link
            href={currentPath === "/" ? "#top" : "/"}
            transitionTypes={transitionTypesFor("/", currentPath)}
            aria-label={currentPath === "/" ? "ODEVELLE, back to top" : "ODEVELLE home"}
            className="flex items-center gap-2.5 text-ink no-underline"
          >
            <Sparkle size={18} />
            <span className="font-serif text-[19px] font-normal tracking-[.3em]">ODEVELLE</span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-7">
            <ul className="m-0 hidden list-none items-center gap-7.5 p-0 text-[15px] whitespace-nowrap xl:flex">
              {primaryNav.map((item) => {
                const current = item.href === currentPath;
                return (
                  <li key={item.href}>
                    <Link
                      className="link-draw text-ink"
                      href={item.href}
                      transitionTypes={transitionTypesFor(item.href, currentPath)}
                      aria-current={current ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  className="link-draw text-muted"
                  href={clientLogin.href}
                  transitionTypes={transitionTypesFor(clientLogin.href, currentPath)}
                >
                  {clientLogin.label}
                </Link>
              </li>
            </ul>
            <Link
              href={ctaLinks.begin}
              transitionTypes={transitionTypesFor(ctaLinks.begin, currentPath)}
              className={button("primary", "hidden min-h-11 px-5.5 text-[15px] font-medium whitespace-nowrap xl:inline-flex")}
            >
              Begin your invitation
            </Link>
            <MobileMenu currentPath={currentPath} />
          </nav>
        </div>
      </header>
    </>
  );
}
