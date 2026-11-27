import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { ALL_MEDIA_TYPES } from "@/invitation/schema/media";
import { RESERVED_SLUGS } from "@/lib/tenant/reserved";
import { createTestDatabase, errorOf } from "./harness";

/* Integrity rules the database enforces no matter which code writes to it. */

test.describe.configure({ mode: "default" });

let db: PGlite;
let clientId: string;
let invA: string;
let invB: string;

const newInvitation = (slug: string, extra: { timeZone?: string; status?: string } = {}) =>
  db.query<{ id: string; published_at: string | null }>(
    `insert into public.invitations (slug, client_id, status, package, design_id, design_version, title, time_zone)
     values ($1, $2, $3, 'classic', 'royal-luxury', 2, 'Test', $4) returning id, published_at`,
    [slug, clientId, extra.status ?? "draft", extra.timeZone ?? "Europe/Lisbon"]);

const media = (invitationId: string, path: string, kind: string, mime: string, bytes: number) =>
  db.query("insert into public.invitation_media (invitation_id, kind, storage_path, mime_type, bytes) values ($1, $2, $3, $4, $5)",
    [invitationId, kind, path, mime, bytes]);

test.beforeAll(async () => {
  db = await createTestDatabase();
  clientId = (await db.query<{ id: string }>("insert into public.clients (display_name) values ('Test') returning id")).rows[0].id;
  invA = (await newInvitation("couple-a")).rows[0].id;
  invB = (await newInvitation("couple-b")).rows[0].id;
});

test.afterAll(async () => {
  await db.close();
});

test.describe("slugs", () => {
  test("reserved subdomains are refused, and the list matches the app's", async () => {
    expect(await errorOf(newInvitation("admin"))).toMatch(/reserved/);
    expect(await errorOf(newInvitation("www"))).toMatch(/reserved/);
    const { rows } = await db.query<{ slug: string }>("select slug from public.reserved_slugs");
    expect(rows.map((r) => r.slug).sort()).toEqual([...RESERVED_SLUGS].sort());
  });

  test("malformed slugs are refused", async () => {
    for (const slug of ["Upper-Case", "double--hyphen", "-leading", "trailing-", "a", "has space", "x".repeat(64)]) {
      expect(await errorOf(newInvitation(slug)), slug).toMatch(/invitations_slug_format/);
    }
  });

  test("slugs are unique", async () => {
    expect(await errorOf(newInvitation("couple-a"))).toMatch(/invitations_slug_key/);
  });
});

test.describe("invitations", () => {
  test("unknown time zones are refused", async () => {
    expect(await errorOf(newInvitation("bad-zone", { timeZone: "Mars/Olympus" }))).toMatch(/time zone/);
  });

  test("published_at is stamped automatically on publish, and kept afterwards", async () => {
    const created = await newInvitation("published-now", { status: "published" });
    expect(created.rows[0].published_at).not.toBeNull();
    const { rows } = await db.query<{ published_at: string | null }>(
      "update public.invitations set status = 'published' where id = $1 returning published_at", [invA]);
    expect(rows[0].published_at).not.toBeNull();
    const first = rows[0].published_at;
    await db.query("update public.invitations set status = 'archived' where id = $1", [invA]);
    const again = await db.query<{ published_at: string }>(
      "update public.invitations set status = 'published' where id = $1 returning published_at", [invA]);
    expect(again.rows[0].published_at).toEqual(first);
  });

  test("passcode access needs a stored hash", async () => {
    expect(await errorOf(db.query("update public.invitations set access_mode = 'passcode' where id = $1", [invB])))
      .toMatch(/invitations_passcode_needs_hash/);
  });

  test("a client with invitations can't be deleted by accident", async () => {
    expect(await errorOf(db.query("delete from public.clients where id = $1", [clientId]))).toMatch(/foreign key/);
  });
});

test.describe("media", () => {
  test("a row must point inside its own invitation's folder", async () => {
    expect(await errorOf(media(invA, `${invB}/gallery/x.webp`, "gallery", "image/webp", 10))).toMatch(/invitation_media_path_scoped/);
    expect(await errorOf(media(invA, `${invA}/../${invB}/x.webp`, "gallery", "image/webp", 10))).toMatch(/invitation_media_path_scoped/);
    expect(await errorOf(media(invA, `${invA}/gallery/ok.webp`, "gallery", "image/webp", 10))).toBeNull();
  });

  test("SVG and mismatched kinds are refused", async () => {
    expect(await errorOf(media(invA, `${invA}/hero/x.svg`, "hero", "image/svg+xml", 10))).toMatch(/invitation_media_kind_type/);
    expect(await errorOf(media(invA, `${invA}/audio/x.webp`, "audio", "image/webp", 10))).toMatch(/invitation_media_kind_type/);
  });

  test("size limits per kind", async () => {
    const MB = 1024 * 1024;
    expect(await errorOf(media(invA, `${invA}/hero/big.webp`, "hero", "image/webp", 15 * MB + 1))).toMatch(/invitation_media_kind_type/);
    expect(await errorOf(media(invA, `${invA}/video/ok.mp4`, "video", "video/mp4", 150 * MB))).toBeNull();
  });

  test("the types the database allows are exactly the app's", async () => {
    const { rows } = await db.query<{ def: string }>(
      "select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'invitation_media_kind_type'");
    const inDb = [...rows[0].def.matchAll(/'([a-z]+\/[a-z0-9.+-]+)'/g)].map((m) => m[1]);
    expect([...new Set(inDb)].sort()).toEqual([...ALL_MEDIA_TYPES].sort());
  });
});

test.describe("RSVPs", () => {
  test("a declined RSVP can't bring guests", async () => {
    expect(await errorOf(db.query(
      "insert into public.rsvps (invitation_id, guest_name, attending, party_size) values ($1, 'No', false, 2)", [invA])))
      .toMatch(/rsvps_declined_has_no_party/);
  });

  test("per-event answers can't mix invitations", async () => {
    const rsvp = (await db.query<{ id: string }>(
      "insert into public.rsvps (invitation_id, guest_name, attending) values ($1, 'Guest', true) returning id", [invA])).rows[0].id;
    const otherEvent = (await db.query<{ id: string }>(
      "insert into public.invitation_events (invitation_id, kind, title, starts_at) values ($1, 'ceremony', 'Other', now()) returning id", [invB])).rows[0].id;
    for (const claimed of [invA, invB]) {
      expect(await errorOf(db.query(
        "insert into public.rsvp_event_responses (rsvp_id, event_id, invitation_id, attending) values ($1, $2, $3, true)",
        [rsvp, otherEvent, claimed]))).toMatch(/foreign key/);
    }
  });
});
