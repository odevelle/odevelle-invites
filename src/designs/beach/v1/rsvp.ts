import type { RsvpFormClasses } from "../../shared/rsvp/parts";

/** Beach v1 (provisional): white on the sea-coloured card, frosted fields, sand-white buttons. */
export const rsvpClasses: Partial<RsvpFormClasses> = {
  form: "mx-auto grid max-w-md gap-5 text-left",
  label: "text-sm font-medium tracking-wide",
  legend: "mb-1.5 p-0 text-sm font-medium tracking-wide",
  hint: "block text-sm font-normal text-white/75",
  input: "min-h-11 w-full rounded-xl border border-white/50 bg-white/15 px-4 text-base text-white placeholder:text-white/60 outline-none transition focus-visible:border-white focus-visible:bg-white/25",
  textarea: "w-full rounded-xl border border-white/50 bg-white/15 px-4 py-3 text-base text-white outline-none transition focus-visible:border-white focus-visible:bg-white/25",
  choice:
    "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/60 px-5 transition has-checked:bg-white has-checked:text-(--inv-primary) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white",
  choiceInput: "sr-only",
  select:
    "min-h-11 w-full max-w-40 cursor-pointer rounded-xl border border-white/50 bg-white/15 px-4 text-base text-white outline-none transition focus-visible:border-white focus-visible:bg-white/25 [&>option]:text-black",
  error: "text-sm text-white",
  alert: "rounded-xl bg-white px-3 py-2 text-sm text-red-800",
  privacy: "text-center text-sm text-white/75",
  submit:
    "justify-self-center min-h-12 cursor-pointer rounded-full bg-white px-8 font-medium text-(--inv-primary) transition hover:bg-white/90 disabled:cursor-progress disabled:opacity-60",
  statusTitle: "font-(family-name:--inv-heading-font) text-3xl italic",
  again: "mx-auto min-h-11 cursor-pointer text-sm text-white underline",
};
