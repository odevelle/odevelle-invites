"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Replay } from "@/components/marketing/icons";

/** Fetches the latest replies on demand (no live connection is kept open). */
export function RefreshButton({ updatedAt }: { updatedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted" aria-live="polite">
        {pending ? "Refreshing…" : `Updated ${updatedAt}`}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-ink/15 bg-transparent px-4 text-sm text-ink hover:border-ink disabled:cursor-progress disabled:opacity-60"
      >
        <Replay size={14} className={pending ? "animate-spin" : undefined} />
        Refresh
      </button>
    </div>
  );
}
