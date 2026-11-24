"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Modal essentials for the menu and preview overlays:
 * Escape closes, page scroll is locked, focus moves into the dialog and
 * returns to the element that opened it.
 */
export function useDialogBehaviour<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  returnFocusTo?: RefObject<HTMLElement | null>,
) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = (returnFocusTo?.current ?? document.activeElement) as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const first = ref.current?.querySelector<HTMLElement>("button, a[href], input, select, textarea");
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, returnFocusTo]);

  return ref;
}
