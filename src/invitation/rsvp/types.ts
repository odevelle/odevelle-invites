/*
 * What the RSVP form and its server action exchange. Shared with the browser,
 * so it holds nothing but what the form renders: never a database record.
 */

export type RsvpErrorReason = "closed" | "rate-limited" | "full" | "unavailable";

export type RsvpFormState =
  | { status: "idle" }
  | { status: "sent"; guestName: string; attending: boolean }
  | {
      status: "invalid";
      /** Field name → message. Field names match the form's `name` attributes. */
      fieldErrors: Record<string, string>;
      /** The submitted text, so the form keeps what the guest typed. */
      values: Record<string, string>;
    }
  | { status: "error"; reason: RsvpErrorReason; values: Record<string, string> };

/** Form field names. */
export const RSVP_FIELDS = {
  name: "name",
  attending: "attending",
  partySize: "partySize",
  meal: "meal",
  message: "message",
  /** A random id per filled-in form, so a double-click or retry stores one reply. */
  submission: "submissionId",
  /** Honeypot: hidden from people, filled in by naive bots. */
  trap: "website",
} as const;
