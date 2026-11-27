import type { PublishedInvitation } from "../parse";
import { RSVP_MAX_GUESTS } from "./limits";

/*
 * What an invitation's RSVP form asks, derived from the record alone (pure).
 * The page renders the form from these rules and the server validates every
 * submission against the same rules, recomputed from the database record, so
 * the two can't disagree and nothing the browser sends can widen them.
 */

export type RsvpRules = {
  /**
   * When replies close (ISO instant): the start of the last RSVP event, or the
   * end of the main day. Undefined: never. A time, not a flag, so pages stay
   * cacheable: the form compares it with the visitor's clock and the server
   * re-checks on every submission (isRsvpOpen).
   */
  closesAt?: string;
  /** Guests per reply, including the person replying: always RSVP_MAX_GUESTS. */
  maxPartySize: number;
  /** The couple's meal options. Empty: the form doesn't ask. */
  mealOptions: string[];
};

/** Undefined when the invitation doesn't take replies at all (feature off). */
export function rsvpRules(invitation: PublishedInvitation): RsvpRules | undefined {
  if (!invitation.features.rsvp) return undefined;

  const rsvpEvents = invitation.events.filter((e) => e.rsvpEnabled);
  const closes = closesAt(invitation, rsvpEvents.length ? rsvpEvents : invitation.events);
  return {
    closesAt: Number.isFinite(closes) ? new Date(closes).toISOString() : undefined,
    maxPartySize: RSVP_MAX_GUESTS,
    mealOptions: invitation.rsvpSettings?.mealOptions ?? [],
  };
}

export const isRsvpOpen = (rules: Pick<RsvpRules, "closesAt">, now: Date): boolean =>
  !rules.closesAt || now.getTime() < Date.parse(rules.closesAt);

function closesAt(invitation: PublishedInvitation, events: { startsAt: string }[]): number {
  if (events.length) return Math.max(...events.map((e) => Date.parse(e.startsAt)));
  // No events: the end of the main day (UTC is close enough for a cut-off). No date: always open.
  if (invitation.primaryDate) return Date.parse(`${invitation.primaryDate}T00:00:00Z`) + 24 * 60 * 60 * 1000;
  return Number.POSITIVE_INFINITY;
}
