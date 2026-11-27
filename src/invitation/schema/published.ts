import { z } from "zod";
import { featureToggles } from "./features";
import { invitationEvent } from "./events";
import { occasion, packageTier } from "./identity";
import { invitationMedia } from "./media";
import { isoDate, isoDateTime, optional, slug, text, timeZone, uuid } from "./primitives";

/** The couple's RSVP options (mirrors rsvp_settings' checks). The guest limit is universal, not a setting. */
export const rsvpSettings = z.strictObject({
  mealOptions: z
    .array(z.string().trim().min(1).max(40))
    .max(6)
    .refine((options) => new Set(options.map((o) => o.toLowerCase())).size === options.length, "Meal options must be distinct"),
});

export type RsvpSettings = z.infer<typeof rsvpSettings>;

/**
 * The record `get_published_invitation(slug)` returns (camelCase JSON).
 *
 * Design-dependent parts (`content`, `appearance`, `designOptions`) are left
 * as `unknown` here and validated in a second step against the schemas of the
 * exact design version the invitation is pinned to (see parse.ts).
 */
export const publishedInvitationRecord = z.strictObject({
  id: uuid,
  slug,
  title: text(160),
  occasion,
  package: packageTier,
  designId: z.string().min(1).max(64),
  designVersion: z.number().int().positive(),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
  timeZone,
  primaryDate: optional(isoDate),
  content: z.unknown(),
  appearance: z.unknown(),
  designOptions: z.unknown(),
  features: featureToggles,
  publishedAt: isoDateTime,
  /** rsvp_settings; null or absent: no meal question. */
  rsvpSettings: rsvpSettings.nullish(),
  events: z.array(invitationEvent).max(30),
  media: z.array(invitationMedia).max(200),
});

export type PublishedInvitationRecord = z.infer<typeof publishedInvitationRecord>;
