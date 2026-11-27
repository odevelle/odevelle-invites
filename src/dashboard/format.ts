/*
 * Dates on the dashboard and in exports, shown in the invitation's own time
 * zone (the couple's), not the server's or the viewer's. Pure.
 */

/** "27 Nov 2026, 14:05" */
export function formatSubmittedAt(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** "2026-11-27 14:05": sorts correctly as text in a spreadsheet. */
export function formatCsvDateTime(iso: string, timeZone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

/** "18 September 2027" from a date-only value (no time zone shift). */
export function formatEventDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
}

export const guestsLabel = (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`;
