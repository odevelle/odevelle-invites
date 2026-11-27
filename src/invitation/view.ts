import type { PublishedInvitation } from "./parse";
import { entitlementsFor } from "./entitlements/packages";
import type { InvitationContent } from "./schema/content";
import type { EventKind } from "./schema/events";
import type { Occasion } from "./schema/identity";
import type { InvitationMedia, MediaKind } from "./schema/media";

/*
 * The shared invitation data contract: what every theme receives, whatever it
 * looks like. Design-neutral and presentation-ready (dates formatted in the
 * invitation's own time zone, map links built, media URLs resolved, gallery
 * capped to the package), so themes only decide how things look.
 *
 * Adding a field here is safe for every theme; renaming or removing one is a
 * breaking change for all of them.
 */

export type MediaView = {
  id: string;
  kind: MediaKind;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  alt: string;
  blurDataUrl?: string;
};

export type EventView = {
  id: string;
  kind: EventKind;
  title: string;
  startsAt: string;
  endsAt?: string;
  /** e.g. "Saturday 12 June 2027", in the invitation's time zone and locale. */
  dateLabel: string;
  /** e.g. "2:00 pm – 3:00 pm". */
  timeLabel: string;
  venueName?: string;
  address?: string;
  dressCode?: string;
  notes?: string;
  /** Present only when maps are enabled and the event has a location. */
  mapHref?: string;
  rsvpEnabled: boolean;
};

export type InvitationView = {
  id: string;
  slug: string;
  title: string;
  occasion: Occasion;
  locale: string;
  timeZone: string;
  content: InvitationContent;
  /** "Charlotte & Henry", "Sofia", "Ana, Rui & family". */
  hostsLine: string;
  /** The main date, if known: long and compact forms. */
  date?: { long: string; compact: string };
  events: EventView[];
  /** ISO instant the countdown runs to (the first event, else the main date). */
  countdownTarget?: string;
  media: {
    hero?: MediaView;
    gallery: MediaView[];
    illustrations: MediaView[];
    audio?: MediaView;
    video?: MediaView;
  };
  /** From the package; the RSVP form (Phase 6) caps party size with it. */
  maxPartySize: number;
};

export type MediaUrlResolver = (path: string) => string;

export function buildInvitationView(invitation: PublishedInvitation, mediaUrl: MediaUrlResolver): InvitationView {
  const { locale, timeZone, features } = invitation;
  const limits = entitlementsFor(invitation.package).limits;

  const dateFmt = new Intl.DateTimeFormat(locale, { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeZone, hour: "numeric", minute: "2-digit" });

  const events: EventView[] = [...invitation.events]
    .sort((a, b) => a.sortOrder - b.sortOrder || Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      dateLabel: dateFmt.format(new Date(e.startsAt)),
      timeLabel: e.endsAt
        ? `${timeFmt.format(new Date(e.startsAt))} – ${timeFmt.format(new Date(e.endsAt))}`
        : timeFmt.format(new Date(e.startsAt)),
      venueName: e.venueName,
      address: e.address,
      dressCode: e.dressCode,
      notes: e.notes,
      mapHref: features.maps ? mapHref(e) : undefined,
      rsvpEnabled: e.rsvpEnabled,
    }));

  const toView = (m: InvitationMedia): MediaView => ({
    id: m.id,
    kind: m.kind,
    url: mediaUrl(m.path),
    mimeType: m.mimeType,
    width: m.width,
    height: m.height,
    alt: m.alt ?? "",
    blurDataUrl: m.blurDataUrl,
  });
  const ofKind = (kind: MediaKind) =>
    invitation.media.filter((m) => m.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder).map(toView);

  const date = invitation.primaryDate ? formatPrimaryDate(invitation.primaryDate, locale) : undefined;

  return {
    id: invitation.id,
    slug: invitation.slug,
    title: invitation.title,
    occasion: invitation.occasion,
    locale,
    timeZone,
    // Custom sections are an Exclusive entitlement: dropped here if not included.
    content: entitlementsFor(invitation.package).customSections
      ? invitation.content
      : { ...invitation.content, customSections: undefined },
    hostsLine: joinNames(invitation.content.hosts.map((h) => h.displayName)),
    date,
    events,
    countdownTarget: events[0]?.startsAt,
    media: {
      hero: ofKind("hero")[0],
      // Second line of defence: never show more than the package allows.
      gallery: features.gallery ? ofKind("gallery").slice(0, limits.galleryItems) : [],
      illustrations: ofKind("illustration"),
      audio: features.music ? ofKind("audio")[0] : undefined,
      video: features.video ? ofKind("video")[0] : undefined,
    },
    maxPartySize: limits.maxPartySize,
  };
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** A calendar date has no time zone; format it as written (UTC noon avoids day shifts). */
function formatPrimaryDate(isoDate: string, locale: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return {
    long: new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d),
    compact: new Intl.DateTimeFormat(locale, { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" })
      .format(d)
      .replaceAll("/", " · "),
  };
}

function mapHref(e: { mapUrl?: string; latitude?: number; longitude?: number; address?: string; venueName?: string }) {
  if (e.mapUrl) return e.mapUrl;
  const query =
    e.latitude !== undefined && e.longitude !== undefined
      ? `${e.latitude},${e.longitude}`
      : [e.venueName, e.address].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : undefined;
}
