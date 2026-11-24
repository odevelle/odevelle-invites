"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { clientLogin, ctaLinks, mobileNav } from "@/content/marketing/navigation";
import { ArrowRight, Close, Menu } from "../icons";
import { transitionTypesFor } from "../PageTransition";
import { button } from "../ui";
import { useDialogBehaviour } from "../useDialogBehaviour";

const circleButton =
  "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink/18 bg-transparent text-ink";

/** Menu button and full-screen menu, shown below 1180px (where the header links no longer fit). */
export function MobileMenu({ currentPath = "/" }: { currentPath?: string }) {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  const dialogRef = useDialogBehaviour<HTMLDivElement>(open, close, openerRef);

  // Close the overlay if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1180px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        className={`${circleButton} xl:hidden`}
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Portalled to <body>: the header's backdrop-filter would otherwise clip a fixed overlay. */}
      {open &&
        createPortal(
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-90 flex flex-col overflow-y-auto bg-cream px-[clamp(20px,5vw,48px)] pb-8"
        >
          <div className="flex h-17 items-center justify-between">
            <span className="font-serif text-[19px] tracking-[.3em]">ODEVELLE</span>
            <button type="button" onClick={close} aria-label="Close menu" className={circleButton}>
              <Close size={18} />
            </button>
          </div>
          <nav aria-label="Menu" className="mt-8 flex flex-col gap-1">
            {mobileNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                transitionTypes={transitionTypesFor(item.href, currentPath)}
                onClick={close}
                aria-current={item.href === currentPath ? "page" : undefined}
                className="py-1.5 font-serif text-[38px] font-medium leading-[1.3] text-ink no-underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 pt-10">
            <Link
              href={ctaLinks.designs}
              transitionTypes={transitionTypesFor(ctaLinks.designs, currentPath)}
              onClick={close}
              className={button("primary", "flex min-h-14 gap-3 text-[17px] font-medium")}>
              Explore Designs
              <ArrowRight size={18} />
            </Link>
            <Link
              href={ctaLinks.whatsapp}
              transitionTypes={transitionTypesFor(ctaLinks.whatsapp, currentPath)}
              onClick={close}
              className="flex min-h-14 items-center justify-center gap-2.5 rounded-full border border-ink/30 text-[17px] text-ink no-underline"
            >
              Message the studio
            </Link>
            <Link
              href={clientLogin.href}
              transitionTypes={transitionTypesFor(clientLogin.href, currentPath)}
              onClick={close}
              className="p-2.5 text-center text-[15px] text-muted underline">
              {clientLogin.label}
            </Link>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
