import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { fixtureSource, RENDERABLE_FIXTURE_SLUGS } from "@/invitation/fixtures";
import { parsePublishedInvitation, type PublishedInvitation } from "@/invitation/parse";
import { buildInvitationView } from "@/invitation/view";
import { as, createTestDatabase } from "./harness";

/*
 * get_published_invitation(): the guests' only read path. Loaded with the seed
 * (generated from the fixtures), so a fixture that the database stores
 * differently, or that its constraints would refuse, fails here.
 */

test.describe.configure({ mode: "default" });

let db: PGlite;

const read = (slug: string) =>
  as(db, "anon", null, async () =>
    (await db.query<{ r: Record<string, unknown> | null }>("select public.get_published_invitation($1) as r", [slug])).rows[0].r);

function parse(raw: unknown, label: string): PublishedInvitation {
  const parsed = parsePublishedInvitation(raw);
  if (!parsed.ok) throw new Error(`${label}: ${parsed.reason}`);
  return parsed.invitation;
}

/** Same instant, whatever offset it's written in; ids that the seed had to de-duplicate are ignored. */
function normalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalise);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).filter(([k]) => k !== "id").map(([k, v]) => [k, normalise(v)]),
    );
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return new Date(value).getTime();
  return value;
}

test.beforeAll(async () => {
  db = await createTestDatabase({ seed: true });
});

test.afterAll(async () => {
  await db.close();
});

test("returns nothing for unknown, draft, archived or passcode invitations", async () => {
  expect(await read("does-not-exist")).toBeNull();
  expect(await read("draft-invitation")).toBeNull();

  await db.query("update public.invitations set status = 'archived' where slug = 'amelia-oliver'");
  expect(await read("amelia-oliver")).toBeNull();
  await db.query("update public.invitations set status = 'published' where slug = 'amelia-oliver'");

  await db.query("update public.invitations set access_mode = 'passcode', access_code_hash = 'x' where slug = 'ines-tomas'");
  expect(await read("ines-tomas")).toBeNull();
  await db.query("update public.invitations set access_mode = 'unlisted', access_code_hash = null where slug = 'ines-tomas'");
  expect(await read("ines-tomas")).not.toBeNull();
});

test("slugs are matched case-insensitively", async () => {
  expect((await read("Amelia-Oliver"))?.slug).toBe("amelia-oliver");
});

test("never exposes private columns", async () => {
  const record = await read("amelia-oliver");
  expect(Object.keys(record ?? {}).sort()).toEqual([
    "appearance", "content", "designId", "designOptions", "designVersion", "events", "features", "id",
    "locale", "media", "occasion", "package", "primaryDate", "publishedAt", "slug", "timeZone", "title",
  ]);
});

test("every renderable fixture comes back from the database as the same invitation", async () => {
  for (const slug of RENDERABLE_FIXTURE_SLUGS) {
    const fromDb = parse(await read(slug), `${slug} (database)`);
    const fromFixture = parse(await fixtureSource.getPublishedRecord(slug), `${slug} (fixture)`);
    const url = (path: string) => `/media/${path}`;
    expect(normalise(buildInvitationView(fromDb, url)), slug).toEqual(normalise(buildInvitationView(fromFixture, url)));
  }
});
