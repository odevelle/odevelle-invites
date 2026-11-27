import type { RsvpResponseRow } from "@/lib/supabase/database.types";
import { formatCsvDateTime } from "./format";

/*
 * CSV export of a couple's replies (RFC 4180). Pure, so it's unit-tested.
 *
 *   - Every cell is quoted, and quotes inside are doubled: commas, quotes and
 *     line breaks in names and messages survive intact.
 *   - Lines end in CRLF, and the file starts with a UTF-8 byte-order mark so
 *     Excel shows names like "João" or "Zoë" correctly.
 *   - A cell starting with = + - @ (or a tab / carriage return) gets a leading
 *     apostrophe. Spreadsheets would otherwise run it as a formula: a guest's
 *     message is untrusted text, opened on the couple's computer.
 */

const BOM = "﻿";
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export const csvRow = (cells: (string | number | null | undefined)[]) => cells.map(csvCell).join(",");

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  return BOM + [csvRow(header), ...rows.map(csvRow)].join("\r\n") + "\r\n";
}

export type RsvpCsvOptions = { timeZone: string; includeMeal: boolean };

export function rsvpCsv(rows: RsvpResponseRow[], { timeZone, includeMeal }: RsvpCsvOptions): string {
  const header = ["Guest name", "Attendance", "Guests", ...(includeMeal ? ["Meal preference"] : []), "Message", "Submitted at", "Possible duplicate"];
  return toCsv(
    header,
    rows.map((r) => [
      r.guest_name,
      r.attending ? "Attending" : "Declined",
      r.party_size,
      ...(includeMeal ? [r.meal_preference] : []),
      r.message,
      formatCsvDateTime(r.submitted_at, timeZone),
      r.same_name_count > 1 ? "Yes" : "",
    ]),
  );
}

/** "odevelle-rsvp-guests-chloe-shane.csv", or "-attending" / "-declined" for a filtered export. */
export const csvFilename = (slug: string, status: "all" | "attending" | "declined") =>
  `odevelle-rsvp-guests-${slug}${status === "all" ? "" : `-${status}`}.csv`;
