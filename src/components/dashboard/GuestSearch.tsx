"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Close } from "@/components/marketing/icons";
import { dashboardHref, SEARCH_MAX, type StatusFilter } from "@/dashboard/query";

const DEBOUNCE_MS = 350;

/**
 * Search by guest name. Waits until typing pauses (350 ms) and skips searches
 * that wouldn't change anything, then updates the URL: the server runs the
 * query (case-insensitive, paged), so the browser never holds the guest list.
 */
export function GuestSearch({ slug, status, q }: { slug: string; status: StatusFilter; q: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(q);
  const [sent, setSent] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The URL changed from outside (back/forward, a filter link): show its search.
  if (q !== lastQ) {
    setLastQ(q);
    if (q !== sent) {
      setSent(q);
      setValue(q);
    }
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (text: string) => {
    clearTimeout(timer.current);
    const next = text.trim().slice(0, SEARCH_MAX);
    if (next === sent) return;
    setSent(next);
    startTransition(() => router.replace(dashboardHref(slug, { status, q: next }), { scroll: false }));
  };

  return (
    <form
      role="search"
      className="relative w-full sm:w-[320px]"
      onSubmit={(e) => {
        e.preventDefault();
        search(value);
      }}
    >
      <label htmlFor="guest-search" className="sr-only">
        Search guests by name
      </label>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
      </svg>
      <input
        id="guest-search"
        type="search"
        value={value}
        maxLength={SEARCH_MAX}
        placeholder="Search guests by name"
        autoComplete="off"
        spellCheck={false}
        aria-busy={pending}
        onChange={(e) => {
          const text = e.target.value;
          setValue(text);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => search(text), DEBOUNCE_MS);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            setValue("");
            search("");
          }
        }}
        className="min-h-11 w-full rounded-full border border-ink/15 bg-white pr-11 pl-10 text-[15px] text-ink outline-none transition-colors placeholder:text-placeholder focus-visible:border-olive focus-visible:ring-2 focus-visible:ring-olive/20 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {pending && <span className="sr-only" role="status">Searching…</span>}
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            search("");
          }}
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:bg-sand hover:text-ink"
        >
          <Close size={14} />
        </button>
      )}
    </form>
  );
}
