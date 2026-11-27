import { z } from "zod";
import { httpsUrl, isoDateTime, optional, text, uuid } from "./primitives";

/**
 * Event kinds across the celebrations ODEVELLE serves. Stored as text in
 * Postgres (format-checked) so adding a kind needs no migration; this list
 * is the allowlist the app accepts.
 */
export const EVENT_KINDS = [
  "ceremony",
  "civil-ceremony",
  "reception",
  "welcome",
  "rehearsal-dinner",
  "roce",
  "haldi",
  "mehndi",
  "sangeet",
  "party",
  "brunch",
  "other",
] as const;
export const eventKind = z.enum(EVENT_KINDS);
export type EventKind = z.infer<typeof eventKind>;

/** One row of `invitation_events`, in the camelCase shape the public read function returns. */
export const invitationEvent = z
  .strictObject({
    id: uuid,
    kind: eventKind,
    title: text(160),
    startsAt: isoDateTime,
    endsAt: optional(isoDateTime),
    venueName: optional(text(160)),
    address: optional(text(500)),
    latitude: optional(z.number().min(-90).max(90)),
    longitude: optional(z.number().min(-180).max(180)),
    mapUrl: optional(httpsUrl),
    dressCode: optional(text(120)),
    notes: optional(text(1000)),
    rsvpEnabled: z.boolean(),
    sortOrder: z.number().int(),
  })
  .refine((e) => !e.endsAt || Date.parse(e.endsAt) > Date.parse(e.startsAt), {
    message: "An event must end after it starts",
    path: ["endsAt"],
  })
  .refine((e) => (e.latitude === undefined) === (e.longitude === undefined), {
    message: "Latitude and longitude go together",
    path: ["longitude"],
  });

export type InvitationEvent = z.infer<typeof invitationEvent>;
