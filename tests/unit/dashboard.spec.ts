import { expect, test } from "@playwright/test";
import { safeDashboardPath } from "@/lib/auth/redirect";
import type { RsvpResponseRow } from "@/lib/supabase/database.types";
import { csvCell, csvFilename, rsvpCsv, toCsv } from "@/dashboard/csv";
import { formatCsvDateTime, formatEventDate, formatSubmittedAt } from "@/dashboard/format";
import { dashboardHref, likePattern, parseDashboardQuery } from "@/dashboard/query";

const row = (patch: Partial<RsvpResponseRow> = {}): RsvpResponseRow => ({
  id: "6f1c2a7e-3b9d-4c1e-9a55-0d2b7e4f8a13",
  invitation_id: "1c400235-5c54-4e84-8a65-4d11fcbdcca7",
  guest_name: "Ana Silva",
  attending: true,
  party_size: 2,
  meal_preference: "Vegetarian",
  message: null,
  submitted_at: "2026-11-27T13:05:00Z",
  same_name_count: 1,
  ...patch,
});

test.describe("CSV export", () => {
  test("quotes every cell and doubles quotes, so commas, quotes and line breaks survive", () => {
    expect(csvCell('Ana "Nana" Silva, Jr.')).toBe('"Ana ""Nana"" Silva, Jr."');
    expect(csvCell("line one\r\nline two")).toBe('"line one\r\nline two"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(3)).toBe('"3"');
  });

  test("defuses spreadsheet formulas in guest text", () => {
    for (const evil of ["=HYPERLINK(\"http://x\",\"click\")", "+1+1", "-2+3", "@SUM(A1)", "\tcmd", "\rcmd"]) {
      expect(csvCell(evil).startsWith(`"'`), evil).toBe(true);
    }
    expect(csvCell("Ana = happy")).toBe('"Ana = happy"');
  });

  test("starts with a UTF-8 BOM, ends lines with CRLF, keeps non-English names", () => {
    const csv = toCsv(["Name"], [["João"], ["Zoë Ångström"], ["李小龙"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1)).toBe('"Name"\r\n"João"\r\n"Zoë Ångström"\r\n"李小龙"\r\n');
  });

  test("one row per reply in the couple's time zone, with the meal column only when asked", () => {
    const rows = [row(), row({ guest_name: "Michael", attending: false, party_size: 0, meal_preference: null, message: "So sorry!", same_name_count: 2 })];
    const withMeal = rsvpCsv(rows, { timeZone: "Asia/Kolkata", includeMeal: true }).slice(1).split("\r\n");
    expect(withMeal[0]).toBe('"Guest name","Attendance","Guests","Meal preference","Message","Submitted at","Possible duplicate"');
    expect(withMeal[1]).toBe('"Ana Silva","Attending","2","Vegetarian","","2026-11-27 18:35",""');
    expect(withMeal[2]).toBe('"Michael","Declined","0","","So sorry!","2026-11-27 18:35","Yes"');
    const noMeal = rsvpCsv(rows, { timeZone: "UTC", includeMeal: false }).slice(1).split("\r\n");
    expect(noMeal[0]).not.toContain("Meal");
    expect(noMeal[1]).toBe('"Ana Silva","Attending","2","","2026-11-27 13:05",""');
  });

  test("filenames name the invitation and any filter", () => {
    expect(csvFilename("chloe-shane", "all")).toBe("odevelle-rsvp-guests-chloe-shane.csv");
    expect(csvFilename("chloe-shane", "declined")).toBe("odevelle-rsvp-guests-chloe-shane-declined.csv");
  });
});

test.describe("dashboard URL state", () => {
  test("parses filter, search, page and guest, falling back to defaults", () => {
    expect(parseDashboardQuery({})).toEqual({ status: "all", q: "", page: 1, guest: undefined });
    expect(parseDashboardQuery({ status: "declined", q: "  ana ", page: "3", guest: "6F1C2A7E-3B9D-4C1E-9A55-0D2B7E4F8A13" })).toEqual({
      status: "declined",
      q: "ana",
      page: 3,
      guest: "6f1c2a7e-3b9d-4c1e-9a55-0d2b7e4f8a13",
    });
    expect(parseDashboardQuery({ status: "maybe", page: "-1", guest: "x" })).toEqual({ status: "all", q: "", page: 1, guest: undefined });
    expect(parseDashboardQuery({ page: "2.5" }).page).toBe(2);
    expect(parseDashboardQuery({ q: "x".repeat(500) }).q).toHaveLength(100);
    expect(parseDashboardQuery({ status: ["attending", "declined"] }).status).toBe("attending");
  });

  test("links leave out defaults", () => {
    expect(dashboardHref("chloe-shane")).toBe("/dashboard/chloe-shane");
    expect(dashboardHref("chloe-shane", { status: "all", page: 1, q: "" })).toBe("/dashboard/chloe-shane");
    expect(dashboardHref("chloe-shane", { status: "attending", q: "da vid", page: 2 })).toBe("/dashboard/chloe-shane?status=attending&q=da+vid&page=2");
  });

  test("search escapes LIKE wildcards, so % and _ match themselves", () => {
    expect(likePattern("ana")).toBe("%ana%");
    expect(likePattern("100%_\\")).toBe("%100\\%\\_\\\\%");
  });
});

test.describe("dates", () => {
  test("in the invitation's time zone", () => {
    expect(formatSubmittedAt("2026-11-27T13:05:00Z", "Europe/Lisbon")).toBe("27 Nov 2026, 13:05");
    expect(formatSubmittedAt("2026-11-27T23:30:00Z", "Asia/Kolkata")).toBe("28 Nov 2026, 05:00");
    expect(formatCsvDateTime("2026-01-02T03:04:00Z", "UTC")).toBe("2026-01-02 03:04");
    expect(formatEventDate("2027-09-18")).toBe("18 September 2027");
  });
});

test.describe("sign-in redirect", () => {
  test("only ever lands on the dashboard", () => {
    expect(safeDashboardPath("/dashboard/chloe-shane")).toBe("/dashboard/chloe-shane");
    for (const evil of ["https://evil.example", "//evil.example", "/dashboard/../admin", "/login", "", null, "/dashboard?x=1", "/dashboardx"]) {
      expect(safeDashboardPath(evil), String(evil)).toBe("/dashboard");
    }
  });
});
