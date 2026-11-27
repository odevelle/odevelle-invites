import { expect, test } from "@playwright/test";
import { charlotteHenryRecord, fixtureSource, RENDERABLE_FIXTURE_SLUGS } from "@/invitation/fixtures";
import { parsePublishedInvitation, type PublishedInvitation } from "@/invitation/parse";
import { buildInvitationView } from "@/invitation/view";

const url = (path: string) => `/media/${path}`;

async function load(slug: string): Promise<PublishedInvitation> {
  const raw = await fixtureSource.getPublishedRecord(slug);
  const parsed = parsePublishedInvitation(raw);
  if (!parsed.ok) throw new Error(`${slug}: ${parsed.reason}`);
  return parsed.invitation;
}

test.describe("fixtures", () => {
  test("every renderable fixture passes validation", async () => {
    for (const slug of RENDERABLE_FIXTURE_SLUGS) await expect(load(slug), slug).resolves.toBeTruthy();
  });

  test("broken fixtures fail for the intended reason", async () => {
    const reasonFor = async (slug: string) => {
      const parsed = parsePublishedInvitation(await fixtureSource.getPublishedRecord(slug));
      return parsed.ok ? "ok" : parsed.reason;
    };
    expect(await reasonFor("broken-theme")).toBe("unknown-design");
    expect(await reasonFor("broken-content")).toBe("invalid-content");
  });

  test("drafts and unknown slugs return nothing, like the database function", async () => {
    expect(await fixtureSource.getPublishedRecord("draft-invitation")).toBeNull();
    expect(await fixtureSource.getPublishedRecord("does-not-exist")).toBeNull();
  });

  test("records are returned as copies (a renderer can't mutate shared fixtures)", async () => {
    const a = (await fixtureSource.getPublishedRecord("charlotte-henry")) as { title: string };
    a.title = "changed";
    const b = (await fixtureSource.getPublishedRecord("charlotte-henry")) as { title: string };
    expect(b.title).toBe("Charlotte & Henry");
  });
});

test.describe("buildInvitationView (the shared theme contract)", () => {
  test("formats dates and times in the invitation's own time zone", async () => {
    const view = buildInvitationView(await load("ines-tomas"), url); // Asia/Kolkata
    expect(view.events[0].dateLabel).toBe("Friday, January 21, 2028");
    expect(view.events[0].timeLabel).toBe("10:30 AM");
    expect(view.events[1].timeLabel).toBe("7:00 PM – 11:30 PM");
    expect(view.date?.long).toBe("Friday, January 21, 2028");
    expect(view.countdownTarget).toBe("2028-01-21T10:30:00+05:30");
  });

  test("joins host names for one, two or more hosts", async () => {
    expect(buildInvitationView(await load("charlotte-henry"), url).hostsLine).toBe("Charlotte & Henry");
    expect(buildInvitationView(await load("maya-turns-30"), url).hostsLine).toBe("Maya");
  });

  test("builds map links only when maps are on, preferring coordinates", async () => {
    const view = buildInvitationView(await load("charlotte-henry"), url);
    expect(view.events[0].mapHref).toBe("https://www.google.com/maps/search/?api=1&query=51.3811%2C-2.359");

    const inv = await load("charlotte-henry");
    const noMaps = buildInvitationView({ ...inv, features: { ...inv.features, maps: false } }, url);
    expect(noMaps.events[0].mapHref).toBeUndefined();
  });

  test("resolves media URLs and caps the gallery to the package limit", async () => {
    const inv = await load("amelia-oliver"); // Signature
    const view = buildInvitationView(inv, url);
    expect(view.media.gallery).toHaveLength(2);
    expect(view.media.gallery[0].url).toBe(`/media/${inv.media[0].path}`);

    // Same invitation on Classic: gallery isn't included, so nothing is shown.
    const asClassic = parsePublishedInvitation({ ...(await fixtureSource.getPublishedRecord("amelia-oliver") as object), package: "classic" });
    expect(asClassic.ok && buildInvitationView(asClassic.invitation, url).media.gallery).toEqual([]);
  });

  test("drops custom sections unless the package includes them", async () => {
    expect(buildInvitationView(await load("elise-julien"), url).content.customSections).toHaveLength(1); // Exclusive
    const asSignature = parsePublishedInvitation({ ...(await fixtureSource.getPublishedRecord("elise-julien") as object), package: "signature" });
    expect(asSignature.ok && buildInvitationView(asSignature.invitation, url).content.customSections).toBeUndefined();
  });

  test("gives the RSVP form the universal 50-guest limit, whatever the package", async () => {
    expect(buildInvitationView(await load("charlotte-henry"), url).rsvp?.maxPartySize).toBe(50);
    expect(buildInvitationView(await load("elise-julien"), url).rsvp?.maxPartySize).toBe(50);
  });

  test("the same record renders through the same contract on any theme", async () => {
    // Swap only the design pin: the view (what themes receive) is unchanged apart from features.
    const base = structuredClone(charlotteHenryRecord) as unknown as Record<string, unknown>;
    const asBeach = { ...base, designId: "beach", designOptions: { intro: "envelope", waves: "calm", emblem: "none" }, appearance: { ...(base.appearance as object), headingFont: "bodoni-moda" } };
    const a = parsePublishedInvitation(base);
    const b = parsePublishedInvitation(asBeach);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const { media: ma, ...va } = buildInvitationView(a.invitation, url);
    const { media: mb, ...vb } = buildInvitationView(b.invitation, url);
    expect(vb).toEqual(va);
    expect(mb).toEqual(ma);
  });
});
