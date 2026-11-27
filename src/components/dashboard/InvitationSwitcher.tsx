"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** For couples with more than one invitation: jump between their dashboards. */
export function InvitationSwitcher({ invitations, current }: { invitations: { slug: string; title: string }[]; current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="sr-only sm:not-sr-only">Invitation</span>
      <select
        value={current}
        aria-busy={pending}
        onChange={(e) => {
          const slug = e.target.value;
          startTransition(() => router.push(`/dashboard/${slug}`));
        }}
        className="min-h-10 max-w-[220px] cursor-pointer rounded-full border border-ink/20 bg-white px-3 text-sm text-ink"
      >
        {invitations.map((i) => (
          <option key={i.slug} value={i.slug}>
            {i.title}
          </option>
        ))}
      </select>
    </label>
  );
}
