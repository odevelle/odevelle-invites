import type { RsvpFormClasses } from "../../shared/rsvp/parts";

/** Portuguese v1 (provisional): white on the azulejo-blue card, square tile-like fields and choices. */
export const rsvpClasses: Partial<RsvpFormClasses> = {
  form: "mx-auto grid max-w-md gap-5 text-left",
  label: "text-xs font-semibold uppercase tracking-[0.18em]",
  legend: "mb-1.5 p-0 text-xs font-semibold uppercase tracking-[0.18em]",
  hint: "mt-0.5 block text-sm font-normal normal-case tracking-normal text-white/75",
  input: "min-h-11 w-full border-2 border-white/70 bg-white px-3 text-base text-[#1f2a44] outline-none focus-visible:border-(--inv-accent)",
  textarea: "w-full border-2 border-white/70 bg-white px-3 py-2 text-base text-[#1f2a44] outline-none focus-visible:border-(--inv-accent)",
  choice:
    "inline-flex min-h-11 cursor-pointer items-center border-2 border-white/70 px-4 transition-colors has-checked:border-white has-checked:bg-white has-checked:text-(--inv-primary) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white",
  choiceInput: "sr-only",
  select:
    "min-h-11 w-full max-w-40 cursor-pointer border-2 border-white/70 bg-white px-3 text-base text-[#1f2a44] outline-none focus-visible:border-(--inv-accent)",
  error: "text-sm text-white",
  alert: "bg-white px-3 py-2 text-sm text-red-800",
  privacy: "text-sm text-white/75",
  submit:
    "min-h-12 cursor-pointer bg-white px-8 text-sm font-semibold uppercase tracking-[0.18em] text-(--inv-primary) transition hover:bg-white/90 disabled:cursor-progress disabled:opacity-60",
  again: "mx-auto min-h-11 cursor-pointer text-sm text-white underline",
};
