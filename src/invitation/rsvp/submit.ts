import "server-only";
import { isUsableSlug } from "@/lib/tenant/slug";
import { parsePublishedInvitation } from "../parse";
import { getPublishedInvitationRecord } from "../queries";
import { isRsvpOpen, rsvpRules } from "./rules";
import { formValues, parseRsvpForm } from "./schema";
import { getRsvpSink, type RsvpSink } from "./sink";
import { RSVP_FIELDS, type RsvpFormState } from "./types";

/**
 * Handles one RSVP. Every rule is re-derived on the server from the
 * invitation's record: the browser only supplies the slug and the answers.
 */
export async function submitRsvp(
  slug: string,
  formData: FormData,
  client: { ip: string | null },
  options: { now?: Date; sink?: RsvpSink } = {},
): Promise<RsvpFormState> {
  const values = formValues(formData);
  const closed: RsvpFormState = { status: "error", reason: "closed", values };

  if (!isUsableSlug(slug)) return closed;

  const parsedRecord = parsePublishedInvitation(await getPublishedInvitationRecord(slug));
  if (!parsedRecord.ok) return closed;
  const invitation = parsedRecord.invitation;

  const rules = rsvpRules(invitation);
  if (!rules || !isRsvpOpen(rules, options.now ?? new Date())) return closed;

  const parsed = parseRsvpForm(formData, rules);
  if (!parsed.ok) return { status: "invalid", fieldErrors: parsed.fieldErrors, values: parsed.values };

  // A filled honeypot is a bot: answer as if it worked, store nothing.
  const trap = formData.get(RSVP_FIELDS.trap);
  if (typeof trap === "string" && trap.trim() !== "") {
    return { status: "sent", guestName: parsed.submission.guestName, attending: parsed.submission.attending };
  }

  const sink = options.sink ?? getRsvpSink();
  const result = await sink.submit({
    ...parsed.submission,
    slug: invitation.slug,
    ipHash: client.ip ? sink.hashIp(client.ip, invitation.id) : null,
  });

  if (result.ok) return { status: "sent", guestName: parsed.submission.guestName, attending: parsed.submission.attending };
  switch (result.reason) {
    case "not-found":
      return closed;
    case "invalid":
      // The form already validated this, so the settings changed underneath (e.g. a meal option was removed).
      return { status: "error", reason: "unavailable", values };
    default:
      return { status: "error", reason: result.reason, values };
  }
}
