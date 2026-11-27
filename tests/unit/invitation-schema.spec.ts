import { expect, test } from "@playwright/test";
import { charlotteHenryRecord, inesTomasRecord } from "@/invitation/fixtures";
import { parsePublishedInvitation } from "@/invitation/parse";

/** Deep-clones a fixture so a test can break one field. */
const clone = <T>(v: T): Record<string, unknown> => structuredClone(v) as unknown as Record<string, unknown>;

test.describe("parsePublishedInvitation", () => {
  test("accepts a valid Classic invitation and resolves its features", () => {
    const result = parsePublishedInvitation(clone(charlotteHenryRecord));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const inv = result.invitation;
    expect(inv.design.id).toBe("royal-luxury");
    expect(inv.appearance.palette.primary).toBe("#9b1b30"); // normalised to lower case
    expect(inv.events[0].mapUrl).toBeUndefined(); // JSON null → undefined
    // Classic doesn't include music, so the invitation's request is dropped.
    expect(inv.features.music).toBe(false);
    expect(inv.features.rsvp).toBe(true);
    expect(inv.features.gallery).toBe(false);
  });

  test("accepts a valid Signature invitation with story, scripture and gallery", () => {
    const result = parsePublishedInvitation(clone(inesTomasRecord));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invitation.features).toMatchObject({ story: true, gallery: true, music: true, video: false });
    expect(result.invitation.events).toHaveLength(2);
  });

  test("an invitation can switch an entitled feature off", () => {
    const raw = clone(inesTomasRecord);
    raw.features = { gallery: false };
    const result = parsePublishedInvitation(raw);
    expect(result.ok && result.invitation.features.gallery).toBe(false);
  });

  test("unknown designs and unregistered versions are refused", () => {
    for (const [designId, designVersion] of [["theatre", 1], ["royal-luxury", 99], ["../../etc/passwd", 1]] as const) {
      const raw = clone(charlotteHenryRecord);
      Object.assign(raw, { designId, designVersion });
      const result = parsePublishedInvitation(raw);
      expect(result.ok, `${designId}@${designVersion}`).toBe(false);
      if (!result.ok) expect(result.reason).toBe("unknown-design");
    }
  });

  test("fonts must come from the design's own set", () => {
    const raw = clone(charlotteHenryRecord);
    (raw.appearance as Record<string, unknown>).headingFont = "comic-sans";
    const result = parsePublishedInvitation(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid-design-config");
  });

  test("options from another design are rejected", () => {
    const raw = clone(charlotteHenryRecord);
    raw.designOptions = { intro: "tile-reveal", tiles: "full-frame", showScripture: true };
    expect(parsePublishedInvitation(raw).ok).toBe(false);
  });

  test("colours must be #RRGGBB", () => {
    for (const bad of ["red", "#fff", "url(javascript:alert(1))", "#12345g"]) {
      const raw = clone(charlotteHenryRecord);
      ((raw.appearance as Record<string, unknown>).palette as Record<string, unknown>).accent = bad;
      expect(parsePublishedInvitation(raw).ok, bad).toBe(false);
    }
  });

  test("content rejects unknown keys (drift surfaces instead of hiding)", () => {
    const raw = clone(charlotteHenryRecord);
    (raw.content as Record<string, unknown>).html = "<script>alert(1)</script>";
    const result = parsePublishedInvitation(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid-content");
  });

  test("events must end after they start, and invalid time zones fail", () => {
    const raw = clone(charlotteHenryRecord);
    const events = raw.events as Record<string, unknown>[];
    events[0].endsAt = "2027-06-12T13:00:00+00:00";
    expect(parsePublishedInvitation(raw).ok).toBe(false);

    const tz = clone(charlotteHenryRecord);
    tz.timeZone = "Mars/Olympus_Mons";
    expect(parsePublishedInvitation(tz).ok).toBe(false);
  });

  test("images need alt text and a type allowed for their kind", () => {
    const raw = clone(inesTomasRecord);
    const media = raw.media as Record<string, unknown>[];
    media[0].alt = null;
    expect(parsePublishedInvitation(raw).ok).toBe(false);

    const wrongType = clone(inesTomasRecord);
    (wrongType.media as Record<string, unknown>[])[0].mimeType = "video/mp4";
    expect(parsePublishedInvitation(wrongType).ok).toBe(false);
  });

  test("reserved or malformed slugs never parse", () => {
    for (const slug of ["admin", "Bad_Slug"]) {
      const raw = clone(charlotteHenryRecord);
      raw.slug = slug;
      expect(parsePublishedInvitation(raw).ok, slug).toBe(false);
    }
  });
});
