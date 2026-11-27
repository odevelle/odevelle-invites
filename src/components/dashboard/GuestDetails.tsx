"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Close } from "@/components/marketing/icons";
import { AttendanceBadge, DuplicateHint } from "./AttendanceBadge";

export type GuestDetailsView = {
  name: string;
  attending: boolean;
  guests: string;
  meal: string | null;
  showMeal: boolean;
  message: string | null;
  submittedAt: string;
  possibleDuplicate: boolean;
};

/**
 * A reply in full, in a modal side panel. Opened by the URL (?guest=…), closed
 * with the button, Escape or a click outside, which go back to the list URL.
 * A native <dialog>: focus moves in, stays in, and returns on close.
 */
export function GuestDetails({ guest, closeHref }: { guest: GuestDetailsView; closeHref: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => router.replace(closeHref, { scroll: false });

  return (
    <dialog
      ref={ref}
      aria-labelledby="guest-details-name"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[440px] border-0 border-l border-linen bg-cream p-0 text-ink shadow-[-24px_0_60px_-40px_rgba(31,36,32,.45)] backdrop:bg-ink/30 sm:w-[440px]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-linen px-6 py-5">
          <div>
            <p className="m-0 text-xs font-medium uppercase tracking-[.22em] text-olive">Reply</p>
            <h2 id="guest-details-name" className="m-0 mt-1 font-serif text-[30px] leading-tight font-medium break-words text-gold">
              {guest.name}
            </h2>
            {guest.possibleDuplicate && <DuplicateHint />}
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-ink/15 bg-transparent text-ink hover:border-ink"
          >
            <Close size={16} />
          </button>
        </div>
        <dl className="m-0 grid gap-5 overflow-y-auto px-6 py-6 text-[15px]">
          <Detail label="Attendance">
            <AttendanceBadge attending={guest.attending} />
          </Detail>
          <Detail label="Number of guests">{guest.guests}</Detail>
          {guest.showMeal && <Detail label="Meal preference">{guest.meal ?? "No preference given"}</Detail>}
          <Detail label="Message">
            {guest.message ? <p className="m-0 whitespace-pre-line break-words">{guest.message}</p> : <span className="text-muted">No message</span>}
          </Detail>
          <Detail label="Submitted">{guest.submittedAt}</Detail>
        </dl>
      </div>
    </dialog>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <dt className="text-xs font-medium uppercase tracking-[.14em] text-muted">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}
