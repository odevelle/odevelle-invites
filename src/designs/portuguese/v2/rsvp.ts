import type { RsvpFormClasses } from "../../shared/rsvp/parts";

/** Portuguese v2 (provisional): light ground framed by tiles, blue square fields, tile-filled choices. */
export const rsvpClasses: Partial<RsvpFormClasses> = {
  form: "mx-auto grid max-w-md gap-5 text-left",
  label: "text-xs font-semibold uppercase tracking-[0.18em] text-(--inv-primary)",
  legend: "mb-1.5 p-0 text-xs font-semibold uppercase tracking-[0.18em] text-(--inv-primary)",
  hint: "mt-0.5 block text-sm font-normal normal-case tracking-normal opacity-70",
  input: "min-h-11 w-full border-2 border-(--inv-primary)/40 bg-white px-3 text-base outline-none focus-visible:border-(--inv-primary)",
  textarea: "w-full border-2 border-(--inv-primary)/40 bg-white px-3 py-2 text-base outline-none focus-visible:border-(--inv-primary)",
  choice:
    "inline-flex min-h-11 cursor-pointer items-center border-2 border-(--inv-primary)/50 bg-white px-4 transition-colors has-checked:border-(--inv-primary) has-checked:bg-(--inv-primary) has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--inv-primary)",
  choiceInput: "sr-only",
  select:
    "min-h-11 w-full max-w-40 cursor-pointer border-2 border-(--inv-primary)/40 bg-white px-3 text-base outline-none focus-visible:border-(--inv-primary)",
  submit:
    "justify-self-center min-h-12 cursor-pointer bg-(--inv-primary) px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110 disabled:cursor-progress disabled:opacity-60",
  privacy: "text-center text-sm opacity-70",
};
