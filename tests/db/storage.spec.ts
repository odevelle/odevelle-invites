import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { ALL_MEDIA_TYPES, MEDIA_RULES } from "@/invitation/schema/media";
import { as, createTestDatabase, createUser, errorOf } from "./harness";

/*
 * storage.objects policies for the invitation-media bucket. (The stand-in
 * storage schema has only what policies need; public URL delivery itself is
 * Supabase's CDN and is checked on the real project.)
 */

test.describe.configure({ mode: "default" });

let db: PGlite;
let admin: string;
let alice: string;
let bob: string;
let aliceInv: string;
let bobInv: string;

const names = (role: "anon" | "authenticated", user: string | null) =>
  as(db, role, user, async () =>
    (await db.query<{ name: string }>("select name from storage.objects where bucket_id = 'invitation-media' order by name")).rows.map((r) => r.name));

const putObject = (name: string) =>
  db.query("insert into storage.objects (bucket_id, name) values ('invitation-media', $1)", [name]);

test.beforeAll(async () => {
  db = await createTestDatabase();
  admin = await createUser(db, { admin: true });
  alice = await createUser(db);
  bob = await createUser(db);
  const invitation = async (owner: string, slug: string) => {
    const client = (await db.query<{ id: string }>(
      "insert into public.clients (owner_user_id, display_name) values ($1, $2) returning id", [owner, slug])).rows[0].id;
    return (await db.query<{ id: string }>(
      `insert into public.invitations (slug, client_id, package, design_id, design_version, title, time_zone)
       values ($1, $2, 'classic', 'royal-luxury', 2, 'T', 'UTC') returning id`, [slug, client])).rows[0].id;
  };
  aliceInv = await invitation(alice, "alice-storage");
  bobInv = await invitation(bob, "bob-storage");
  await putObject(`${aliceInv}/gallery/a.webp`);
  await putObject(`${bobInv}/gallery/b.webp`);
  await putObject("not-a-uuid/stray.webp");
});

test.afterAll(async () => {
  await db.close();
});

test("the bucket is public for delivery, with the app's types and largest size", async () => {
  const { rows } = await db.query<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(
    "select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'invitation-media'");
  expect(rows[0].public).toBe(true);
  expect(Number(rows[0].file_size_limit)).toBe(Math.max(...Object.values(MEDIA_RULES).map((r) => r.maxBytes)));
  expect([...rows[0].allowed_mime_types].sort()).toEqual([...ALL_MEDIA_TYPES].sort());
});

test("guests can't list or browse any folder", async () => {
  expect(await names("anon", null)).toEqual([]);
});

test("guests can't upload, overwrite or delete", async () => {
  await as(db, "anon", null, async () => {
    expect(await errorOf(putObject(`${aliceInv}/gallery/evil.webp`))).toMatch(/row-level security/);
    await db.query("delete from storage.objects");
  });
  expect(await names("authenticated", admin)).toHaveLength(3);
});

test("owners see only their own invitation's folder", async () => {
  expect(await names("authenticated", alice)).toEqual([`${aliceInv}/gallery/a.webp`]);
  expect(await names("authenticated", bob)).toEqual([`${bobInv}/gallery/b.webp`]);
});

test("owners can't upload or delete in V1 (the studio does)", async () => {
  await as(db, "authenticated", alice, async () => {
    expect(await errorOf(putObject(`${aliceInv}/gallery/mine.webp`))).toMatch(/row-level security/);
    await db.query("delete from storage.objects");
  });
  expect(await names("authenticated", admin)).toHaveLength(3);
});

test("admins manage every folder", async () => {
  await as(db, "authenticated", admin, async () => {
    await putObject(`${bobInv}/hero/new.webp`);
    await db.query("delete from storage.objects where name = 'not-a-uuid/stray.webp'");
  });
  expect(await names("authenticated", admin)).toEqual(
    [`${aliceInv}/gallery/a.webp`, `${bobInv}/gallery/b.webp`, `${bobInv}/hero/new.webp`].sort());
});

test("the policies don't touch other buckets", async () => {
  await db.query("insert into storage.buckets (id, name) values ('other', 'other')");
  await db.query("insert into storage.objects (bucket_id, name) values ('other', $1)", [`${aliceInv}/x.webp`]);
  const seen = await as(db, "authenticated", admin, async () =>
    (await db.query("select 1 from storage.objects where bucket_id = 'other'")).rows.length);
  expect(seen).toBe(0);
});
