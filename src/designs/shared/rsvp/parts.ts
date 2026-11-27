/*
 * The RSVP form's styling slots. A theme passes class names (plain CSS or
 * Tailwind) for any of these; the rest fall back to the neutral defaults.
 * Behaviour, wording and accessibility never change per theme.
 */

export type RsvpFormPart =
  | "form" | "field" | "label" | "hint" | "input" | "textarea" | "select"
  | "group" | "legend" | "choices" | "choice" | "choiceInput"
  | "error" | "alert" | "privacy" | "submit"
  | "status" | "statusTitle" | "again";

export type RsvpFormClasses = Record<RsvpFormPart, string>;

export const defaultRsvpClasses: RsvpFormClasses = {
  form: "mx-auto grid max-w-md gap-5 text-left",
  field: "grid gap-1.5",
  label: "text-sm font-medium",
  hint: "block text-sm font-normal opacity-70",
  input: "min-h-11 w-full rounded-md border border-current/30 bg-white/80 px-3 text-base text-black",
  textarea: "w-full rounded-md border border-current/30 bg-white/80 px-3 py-2 text-base text-black",
  group: "m-0 grid min-w-0 gap-2.5 border-0 p-0",
  legend: "mb-1 p-0 text-sm font-medium",
  choices: "flex flex-wrap gap-2",
  choice:
    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-current/40 px-4 has-checked:border-current has-checked:bg-current/10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
  choiceInput: "accent-current",
  select: "min-h-11 w-full max-w-40 cursor-pointer rounded-md border border-current/30 bg-white/80 px-3 text-base text-black",
  error: "text-sm text-red-700",
  alert: "rounded-md bg-red-50 px-3 py-2 text-sm text-red-800",
  privacy: "text-sm opacity-70",
  submit: "min-h-11 cursor-pointer rounded-full bg-(--inv-primary) px-6 font-medium text-white disabled:cursor-progress disabled:opacity-60",
  status: "mx-auto grid max-w-md gap-2 text-center focus:outline-none",
  statusTitle: "text-lg font-medium",
  again: "mx-auto min-h-11 cursor-pointer text-sm underline",
};

export const resolveRsvpClasses = (classes?: Partial<RsvpFormClasses>): RsvpFormClasses => ({ ...defaultRsvpClasses, ...classes });
