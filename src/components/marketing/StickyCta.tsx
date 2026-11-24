import Link from "next/link";
import { ctaLinks } from "@/content/marketing/navigation";
import { ChatBubble } from "./icons";
import { transitionTypesFor } from "./PageTransition";
import { button } from "./ui";

/** Bottom action bar on phones (hidden from 720px). Sticks while its parent scrolls past. */
export function StickyCta({ currentPath = "/" }: { currentPath?: string }) {
  return (
    <div className="sticky bottom-0 z-30 flex items-center gap-2.5 bg-[linear-gradient(to_top,#F7F5EF_70%,rgba(247,245,239,0))] px-4 pt-4.5 pb-3.5 md:hidden">
      <Link
        href={ctaLinks.begin}
        transitionTypes={transitionTypesFor(ctaLinks.begin, currentPath)}
        className={button(
          "primary",
          "flex min-h-13.5 flex-auto gap-2.5 text-[17px] font-medium shadow-[0_12px_24px_-12px_rgba(74,94,63,.8)]",
        )}
      >
        Begin your invitation
      </Link>
      <Link
        href={ctaLinks.whatsapp}
        transitionTypes={transitionTypesFor(ctaLinks.whatsapp, currentPath)}
        aria-label="Message the studio on WhatsApp"
        className="flex h-13.5 w-13.5 flex-none items-center justify-center rounded-full border border-ink/25 bg-cream text-ink"
      >
        <ChatBubble size={22} />
      </Link>
    </div>
  );
}
