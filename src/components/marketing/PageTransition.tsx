import { ViewTransition, type ReactNode } from "react";

/*
 * Page-to-page transitions for the marketing site.
 *
 * Going from the landing page to a sub-page (e.g. /features) plays "page-down":
 * the old page eases up and out while the new one rises in, like continuing to
 * scroll. Returning to the landing page plays "page-up", the reverse.
 * Same-page hash links (/#pricing while on /) keep their normal smooth scroll.
 *
 * The animations themselves live in globals.css (::view-transition-* rules).
 */

export type PageTransitionType = "page-down" | "page-up";

/** Transition types for a <Link>, or undefined when the link stays on the current page. */
export function transitionTypesFor(href: string, currentPath: string): PageTransitionType[] | undefined {
  const targetPath = href.split("#")[0] || currentPath;
  if (targetPath === currentPath) return undefined;
  return [targetPath === "/" ? "page-up" : "page-down"];
}

const directional = { "page-down": "page-down", "page-up": "page-up", default: "none" };

/**
 * Wrap each page's outermost element (in page.tsx, not the layout) so enter/exit
 * animations fire on navigation. It must sit above every DOM node of the page:
 * React only animates a ViewTransition whose own subtree is shown or hidden.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={directional} exit={directional} default="none">
      {children}
    </ViewTransition>
  );
}
