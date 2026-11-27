import type { RsvpFormClasses } from "../../shared/rsvp/parts";

/** Floral v1 (provisional): soft white fields, petal-rounded choices, the garden's primary colour. */
export const rsvpClasses: Partial<RsvpFormClasses> = {
  form: "mx-auto grid max-w-md gap-5 text-left",
  label: "text-sm font-medium tracking-wide text-(--inv-secondary)",
  legend: "mb-1.5 p-0 text-sm font-medium tracking-wide text-(--inv-secondary)",
  input: "min-h-11 w-full rounded-2xl border border-(--inv-primary)/40 bg-white px-4 text-base shadow-sm outline-none transition focus-visible:border-(--inv-primary) focus-visible:ring-2 focus-visible:ring-(--inv-primary)/25",
  textarea: "w-full rounded-2xl border border-(--inv-primary)/40 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus-visible:border-(--inv-primary) focus-visible:ring-2 focus-visible:ring-(--inv-primary)/25",
  choice:
    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[1.4rem_0.4rem] border border-(--inv-primary)/50 bg-white px-5 transition has-checked:border-(--inv-primary) has-checked:bg-(--inv-primary) has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-(--inv-primary)/40",
  choiceInput: "sr-only",
  select:
    "min-h-11 w-full max-w-40 cursor-pointer rounded-2xl border border-(--inv-primary)/40 bg-white px-4 text-base shadow-sm outline-none transition focus-visible:border-(--inv-primary) focus-visible:ring-2 focus-visible:ring-(--inv-primary)/25",
  submit:
    "min-h-12 cursor-pointer rounded-full bg-(--inv-primary) px-8 font-medium tracking-wide text-white shadow-sm transition hover:brightness-110 disabled:cursor-progress disabled:opacity-60",
  statusTitle: "font-(family-name:--inv-heading-font) text-4xl text-(--inv-secondary)",
};
