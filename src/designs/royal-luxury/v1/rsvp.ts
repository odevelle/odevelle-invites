import type { RsvpFormClasses } from "../../shared/rsvp/parts";

/** Royal Luxury v1 (provisional): ivory ground, hairline gold rules, underlined inputs; the script face only for the thank-you. */
export const rsvpClasses: Partial<RsvpFormClasses> = {
  form: "mx-auto grid max-w-md gap-6 text-left",
  label: "text-xs font-semibold uppercase tracking-[0.2em] text-(--inv-primary)",
  legend: "mb-2 p-0 text-xs font-semibold uppercase tracking-[0.2em] text-(--inv-primary)",
  hint: "mt-0.5 block text-sm font-normal normal-case tracking-normal italic opacity-70",
  input: "min-h-11 w-full border-0 border-b border-(--inv-accent) bg-transparent px-1 text-base outline-none transition-colors focus-visible:border-(--inv-primary)",
  textarea: "w-full border border-(--inv-accent)/60 bg-transparent px-3 py-2 text-base outline-none transition-colors focus-visible:border-(--inv-primary)",
  choice:
    "inline-flex min-h-11 cursor-pointer items-center border border-(--inv-accent) px-5 italic transition-colors has-checked:bg-(--inv-primary) has-checked:text-white has-checked:not-italic has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--inv-primary)",
  choiceInput: "sr-only",
  select:
    "min-h-11 w-full max-w-40 cursor-pointer border-0 border-b border-(--inv-accent) bg-transparent px-1 text-base outline-none focus-visible:border-(--inv-primary)",
  submit:
    "justify-self-center min-h-12 cursor-pointer border border-(--inv-primary) px-10 text-sm font-semibold uppercase tracking-[0.24em] text-(--inv-primary) transition-colors hover:bg-(--inv-primary) hover:text-white disabled:cursor-progress disabled:opacity-60",
  privacy: "text-center text-sm italic opacity-70",
  statusTitle: "font-(family-name:--inv-heading-font) text-3xl text-(--inv-primary)",
};
