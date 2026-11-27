/** Attending / Declined, distinct by colour and by text (never colour alone). */
export function AttendanceBadge({ attending }: { attending: boolean }) {
  return attending ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-wash px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-olive-deep">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-olive" />
      Attending
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-linen bg-sand px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-muted">
      <span aria-hidden="true" className="size-1.5 rounded-full border border-stone" />
      Declined
    </span>
  );
}

export function DuplicateHint() {
  return (
    <span className="text-xs whitespace-nowrap text-gold-deep" title="Another reply on this invitation uses the same name">
      Possible duplicate
    </span>
  );
}
