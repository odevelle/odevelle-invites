"use client";

import { useEffect, useRef } from "react";
import type { RsvpFormClasses } from "./parts";

/** The thank-you state. Takes focus so screen readers announce it and keyboard users stay in place. */
export function RsvpConfirmation({
  guestName,
  attending,
  hostsLine,
  c,
  onAgain,
}: {
  guestName: string;
  attending: boolean;
  hostsLine: string;
  c: RsvpFormClasses;
  onAgain: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const firstName = guestName.split(/\s+/)[0];
  return (
    <div ref={ref} tabIndex={-1} role="status" className={c.status} data-rsvp-state="sent">
      <p className={c.statusTitle}>Thank you, {firstName}</p>
      <p className={c.hint}>
        Your reply is on its way to {hostsLine}.{attending ? " We look forward to celebrating with you." : " You’ll be missed."}
      </p>
      <button type="button" className={c.again} onClick={onAgain}>
        Reply for someone else
      </button>
    </div>
  );
}
