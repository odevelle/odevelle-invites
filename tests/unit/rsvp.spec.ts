import { expect, test } from "@playwright/test";
import { fixtureSource } from "@/invitation/fixtures";
import { parsePublishedInvitation, type PublishedInvitation } from "@/invitation/parse";
import { RSVP_MAX_GUESTS } from "@/invitation/rsvp/limits";
import { isRsvpOpen, rsvpRules, type RsvpRules } from "@/invitation/rsvp/rules";
import { parseRsvpForm } from "@/invitation/rsvp/schema";
import { buildInvitationView } from "@/invitation/view";

const BEFORE = new Date("2026-11-27T12:00:00Z");
const SUBMISSION = "6f1c2a7e-3b9d-4c1e-9a55-0d2b7e4f8a13";

async function load(slug: string, patch: Record<string, unknown> = {}): Promise<PublishedInvitation> {
  const parsed = parsePublishedInvitation({ ...((await fixtureSource.getPublishedRecord(slug)) as object), ...patch });
  if (!parsed.ok) throw new Error(`${slug}: ${parsed.reason}`);
  return parsed.invitation;
}

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

test.describe("RSVP rules", () => {
  test("without settings: up to 50 guests and no meal question", async () => {
    const invitation = await load("maya-turns-30");
    expect(rsvpRules(invitation)).toEqual({ closesAt: new Date(invitation.events[0].startsAt).toISOString(), maxPartySize: 50, mealOptions: [] });
  });

  test("the guest limit is the same 50 for every package; only meals are configurable", async () => {
    expect(RSVP_MAX_GUESTS).toBe(50);
    for (const slug of ["leela-arjun", "chloe-shane", "elise-julien"]) {
      // Classic, Signature, Exclusive
      expect(rsvpRules(await load(slug))?.maxPartySize, slug).toBe(50);
    }
    expect(rsvpRules(await load("leela-arjun"))?.mealOptions).toEqual(["Vegetarian", "Non-vegetarian", "Vegan"]);
  });

  test("a guest limit can't be smuggled in through the settings", async () => {
    const record = (await fixtureSource.getPublishedRecord("leela-arjun")) as object;
    expect(parsePublishedInvitation({ ...record, rsvpSettings: { maxPartySize: 4, mealOptions: [] } }).ok).toBe(false);
  });

  test("malformed settings fail validation instead of reaching the form", async () => {
    const record = (await fixtureSource.getPublishedRecord("leela-arjun")) as object;
    for (const rsvpSettings of [
      { mealOptions: ["Veg", "veg"] },
      { mealOptions: ["a", "b", "c", "d", "e", "f", "g"] },
      { mealOptions: ["x".repeat(41)] },
    ]) {
      expect(parsePublishedInvitation({ ...record, rsvpSettings }).ok, JSON.stringify(rsvpSettings)).toBe(false);
    }
  });

  test("replies close once the last RSVP event has started", async () => {
    const rules = rsvpRules(await load("leela-arjun")) as RsvpRules;
    const start = Date.parse(rules.closesAt ?? "");
    expect(isRsvpOpen(rules, new Date(start - 1))).toBe(true);
    expect(isRsvpOpen(rules, new Date(start))).toBe(false);
    expect(isRsvpOpen(rules, BEFORE)).toBe(true);
    expect(isRsvpOpen({}, new Date("2100-01-01"))).toBe(true); // no events, no date: always open
  });

  test("no rules when the invitation has RSVP switched off", async () => {
    expect(rsvpRules(await load("leela-arjun", { features: { rsvp: false } }))).toBeUndefined();
  });

  test("the theme view carries the same rules", async () => {
    const view = buildInvitationView(await load("chloe-shane"), (p) => p);
    expect(view.rsvp).toMatchObject({ maxPartySize: 50, mealOptions: ["Vegetarian", "Non-vegetarian"] });
    expect(buildInvitationView(await load("leela-arjun", { features: { rsvp: false } }), (p) => p).rsvp).toBeUndefined();
  });
});

test.describe("RSVP form validation", () => {
  const rules: RsvpRules = { maxPartySize: 50, mealOptions: ["Vegetarian", "Non-vegetarian"] };
  const noMeals: RsvpRules = { maxPartySize: 50, mealOptions: [] };

  test("accepts a reply, trimming text and dropping empty optional fields", () => {
    const result = parseRsvpForm(
      form({ name: "  Ana Silva ", attending: "yes", partySize: "3", meal: "Vegetarian", message: "", submissionId: SUBMISSION }),
      rules,
    );
    expect(result).toEqual({
      ok: true,
      submission: { guestName: "Ana Silva", attending: true, partySize: 3, meal: "Vegetarian", message: undefined, submissionId: SUBMISSION },
    });
  });

  test("a decline brings no one and no meal, whatever else was sent", () => {
    const result = parseRsvpForm(form({ name: "Ana", attending: "no", partySize: "4", meal: "Vegetarian" }), rules);
    expect(result.ok && result.submission).toMatchObject({ attending: false, partySize: 0, meal: undefined });
  });

  test("reports each problem against its field and echoes what was typed", () => {
    const result = parseRsvpForm(form({ name: " ", attending: "maybe", message: "x".repeat(2001) }), rules);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["attending", "message", "name"]);
    expect(result.values.message).toHaveLength(2000);
  });

  test("attending: 1 to 50 guests, never more, never missing", () => {
    for (const partySize of ["51", "100", "0", "-1", "", "2.5", "abc"]) {
      const result = parseRsvpForm(form({ name: "Ana", attending: "yes", partySize }), rules);
      expect(result.ok, partySize).toBe(false);
    }
    for (const partySize of ["1", "50"]) {
      const result = parseRsvpForm(form({ name: "Ana", attending: "yes", partySize }), rules);
      expect(result.ok && result.submission.partySize, partySize).toBe(Number(partySize));
    }
    const over = parseRsvpForm(form({ name: "Ana", attending: "yes", partySize: "51" }), rules);
    expect(!over.ok && over.fieldErrors.partySize).toBe("Up to 50 guests per reply");
  });

  test("meal: optional, but only one of the couple's options", () => {
    const none = parseRsvpForm(form({ name: "Ana", attending: "yes", partySize: "1" }), rules);
    expect(none.ok && none.submission.meal).toBeUndefined();
    const unknown = parseRsvpForm(form({ name: "Ana", attending: "yes", partySize: "1", meal: "Fish" }), rules);
    expect(!unknown.ok && Object.keys(unknown.fieldErrors)).toEqual(["meal"]);
  });

  test("a meal is ignored when the couple doesn't ask about meals", () => {
    const result = parseRsvpForm(form({ name: "Ana", attending: "yes", partySize: "1", meal: "Vegetarian" }), noMeals);
    expect(result.ok && result.submission.meal).toBeUndefined();
  });

  test("a missing or malformed submission id only drops retry protection", () => {
    for (const submissionId of ["", "not-a-uuid"]) {
      const result = parseRsvpForm(form({ name: "Ana", attending: "no", submissionId }), rules);
      expect(result.ok && result.submission.submissionId, submissionId).toBeUndefined();
    }
  });

  test("never echoes the honeypot or the submission id", () => {
    const result = parseRsvpForm(form({ name: "", website: "spam", submissionId: SUBMISSION }), rules);
    expect(!result.ok && result.values).toEqual({ name: "" });
  });
});
