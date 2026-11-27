import { z } from "zod";
import type { RsvpRules } from "./rules";
import { RSVP_FIELDS } from "./types";

/*
 * Server-side validation of a submitted RSVP form against the invitation's
 * rules. Pure: FormData in, a typed submission or field errors out.
 */

export type RsvpSubmission = {
  guestName: string;
  attending: boolean;
  /** Includes the guest. 0 when declining. */
  partySize: number;
  /** One of the couple's meal options; only for guests who are coming. */
  meal?: string;
  message?: string;
  /** From the form; absent if the form was sent before the page finished loading. */
  submissionId?: string;
};

export type RsvpParseResult =
  | { ok: true; submission: RsvpSubmission }
  | { ok: false; fieldErrors: Record<string, string>; values: Record<string, string> };

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || undefined);

const name = z.string().trim().min(1, "Please enter your full name").max(120, "Please keep your name under 120 characters");
const answer = z.enum(["yes", "no"], { error: "Please let us know if you can come" });
const submissionId = z
  .string()
  .transform((v) => v || undefined)
  .pipe(z.uuid().optional());

/** The text fields echoed back on errors (never the honeypot or internal fields). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && key !== RSVP_FIELDS.trap && key !== RSVP_FIELDS.submission && !key.startsWith("$ACTION")) {
      values[key] = value.slice(0, 2000);
    }
  }
  return values;
}

export function parseRsvpForm(formData: FormData, rules: RsvpRules): RsvpParseResult {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  const errors: Record<string, string> = {};
  const field = <T>(key: string, schema: z.ZodType<T>, value: string = read(key)): T | undefined => {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    errors[key] = result.error.issues[0]?.message ?? "Please check this field";
    return undefined;
  };

  const guestName = field(RSVP_FIELDS.name, name);
  const attending = field(RSVP_FIELDS.attending, answer) === "yes";
  const message = field(RSVP_FIELDS.message, optionalText(2000, "Please keep your message under 2,000 characters"));

  let partySize = 0;
  let meal: string | undefined;
  if (attending) {
    partySize =
      field(
        RSVP_FIELDS.partySize,
        z.coerce
          .number({ error: "Please choose how many are coming" })
          .int("Please choose how many are coming")
          .min(1, "Please choose how many are coming")
          .max(rules.maxPartySize, `Up to ${rules.maxPartySize} guests per reply`),
      ) ?? 0;
    meal = rules.mealOptions.length
      ? field(
          RSVP_FIELDS.meal,
          z
            .string()
            .transform((v) => v || undefined)
            .pipe(z.enum(rules.mealOptions as [string, ...string[]], { error: "Please choose one of the options" }).optional()),
        )
      : undefined;
  }

  // An unusable id only loses retry protection; it's never the guest's problem.
  const id = submissionId.safeParse(read(RSVP_FIELDS.submission));

  if (Object.keys(errors).length || guestName === undefined) {
    return { ok: false, fieldErrors: errors, values: formValues(formData) };
  }
  return {
    ok: true,
    submission: {
      guestName,
      attending,
      partySize,
      meal,
      message,
      submissionId: id.success ? id.data : undefined,
    },
  };
}
