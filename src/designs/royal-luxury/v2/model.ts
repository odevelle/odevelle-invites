import type { EventKind } from "@/invitation/schema/events";
import type { EventView, InvitationView } from "@/invitation/view";
import type { IconKey } from "./assets";

/*
 * What Royal Luxury shows, derived from the shared invitation contract.
 * Pure functions: no React, easy to reason about and test.
 */

export type LocationCard = {
  key: string;
  venueName: string;
  address?: string;
  timeLabel: string;
  mapHref?: string;
  /** `data:` URL of an .ics file for "Add to calendar". */
  calendarHref: string;
  illustration: "church" | "mansion";
};

export type Moment = { id: string; title: string; time: string; icon: IconKey };

const timeFormat = (inv: InvitationView) =>
  new Intl.DateTimeFormat(inv.locale, { timeZone: inv.timeZone, hour: "numeric", minute: "2-digit" });

const CEREMONY_KINDS: readonly EventKind[] = ["ceremony", "civil-ceremony"];

/**
 * One card per venue, in order of first appearance. Events sharing a venue
 * (cocktails, dinner, dancing…) become one card spanning their times, as in
 * the PSD's "Reception · 17:00 – 20:00".
 */
export function locationCards(inv: InvitationView): LocationCard[] {
  const groups = new Map<string, EventView[]>();
  for (const e of inv.events) {
    if (!e.venueName) continue;
    const key = e.venueName.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const fmt = timeFormat(inv);
  return [...groups.entries()].map(([key, events]) => {
    const first = events[0];
    const last = events[events.length - 1];
    const end = last.endsAt ?? (events.length > 1 ? last.startsAt : undefined);
    const timeLabel =
      events.length === 1 ? first.timeLabel : `${fmt.format(new Date(first.startsAt))} – ${fmt.format(new Date(end ?? first.startsAt))}`;
    const address = events.find((e) => e.address)?.address;
    return {
      key,
      venueName: first.venueName!,
      address,
      timeLabel,
      mapHref: events.find((e) => e.mapHref)?.mapHref,
      calendarHref: calendarHref({
        uid: `${first.id}@odevelle.com`,
        title: `${first.title} · ${inv.hostsLine}`,
        start: first.startsAt,
        end,
        location: [first.venueName, address].filter(Boolean).join(", "),
      }),
      illustration: events.some((e) => CEREMONY_KINDS.includes(e.kind)) ? "church" : "mansion",
    };
  });
}

const ICON_ORDER: readonly IconKey[] = ["arch", "rings", "champagne", "cake", "dance"];

const PREFERRED_ICON: Record<EventKind, IconKey> = {
  welcome: "arch",
  ceremony: "rings",
  "civil-ceremony": "rings",
  roce: "rings",
  reception: "champagne",
  "rehearsal-dinner": "champagne",
  brunch: "champagne",
  party: "cake",
  sangeet: "cake",
  mehndi: "cake",
  haldi: "cake",
  other: "dance",
};

/** Every event, in order, each with an illustration (no repeats while unused ones remain). */
export function moments(inv: InvitationView): Moment[] {
  const used = new Set<IconKey>();
  const fmt = timeFormat(inv);
  return inv.events.map((e) => {
    let icon = PREFERRED_ICON[e.kind];
    if (used.has(icon)) icon = ICON_ORDER.find((k) => !used.has(k)) ?? icon;
    used.add(icon);
    return { id: e.id, title: e.title, time: fmt.format(new Date(e.startsAt)), icon };
  });
}

/** The first dress code given (normally the ceremony's). */
export const dressCode = (inv: InvitationView) => inv.events.find((e) => e.dressCode)?.dressCode;

/** "10 . 12 . 2026", in the invitation locale's day/month order. */
export function dottedDate(inv: InvitationView): string | undefined {
  return inv.date?.compact.split(/\D+/).filter(Boolean).join(" . ");
}

/* ------------------------------------------------------------- calendar */

const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
const icsTime = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function calendarHref(e: { uid: string; title: string; start: string; end?: string; location?: string }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ODEVELLE//Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${icsTime(e.start)}`,
    `DTSTART:${icsTime(e.start)}`,
    ...(e.end ? [`DTEND:${icsTime(e.end)}`] : []),
    `SUMMARY:${icsText(e.title)}`,
    ...(e.location ? [`LOCATION:${icsText(e.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
