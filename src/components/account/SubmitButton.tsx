"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** A submit button that shows its form is working and can't be pressed twice. */
export function SubmitButton({ children, pendingLabel, className }: { children: ReactNode; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={`${className ?? ""} disabled:cursor-progress disabled:opacity-70`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
