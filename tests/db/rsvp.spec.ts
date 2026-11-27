import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { as, createTestDatabase, createUser, errorOf } from "./harness";

/*
 * submit_rsvp(): the only write path for RSVPs, and rsvp_settings, which it
 * enforces. Runs with Supabase's automatic API grants off and on.
 */

test.describe.configure({ mode: "default" });

const HASH_A = "a".repeat(64);

type Submit = {
  slug?: string;
  submission?: string | null;
  name?: string;
  attending?: boolean | null;
  party?: number;
  meal?: string | null;
  message?: string | null;
  ip?: string | null;
};

const SUBMIT = "select public.submit_rsvp($1, $2, $3, $4, $5, $6, $7, $8) as id";

for (const autoGrants of [false, true]) test.describe(`automatic API grants ${autoGrants ? "on" : "off"}`, () => {
  let db: PGlite;
  let owner: string;
  let admin: string;
  let clientId: string;
  const inv = { published: "", other: "" };

  const one = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0];

  const invitation = async (slug: string, status = "published") =>
    (await one<{ id: string }>(
      `insert into public.invitations (slug, client_id, status, package, design_id, design_version, title, time_zone)
       values ($1, $2, $3, 'signature', 'royal-luxury', 2, 'T', 'Europe/Lisbon') returning id`, [slug, clientId, status])).id;

  const submit = (s: Submit = {}) =>
    as(db, "service_role", null, () =>
      db.query<{ id: string }>(SUBMIT, [
        s.slug ?? "ana-and-rui",
        s.submission ?? null,
        s.name ?? "  Guest Name ",
        s.attending === undefined ? true : s.attending,
        s.party ?? 2,
        s.meal === undefined ? null : s.meal,
        s.message === undefined ? "" : s.message,
        s.ip === undefined ? HASH_A : s.ip,
      ]));

  test.beforeAll(async () => {
    db = await createTestDatabase({ autoGrants });
    owner = await createUser(db);
    admin = await createUser(db, { admin: true });
    clientId = (await one<{ id: string }>("insert into public.clients (owner_user_id, display_name) values ($1, 'Ana & Rui') returning id", [owner])).id;
    inv.published = await invitation("ana-and-rui");
    inv.other = await invitation("someone-else");
    await invitation("still-a-draft", "draft");
    await db.query("insert into public.rsvp_settings (invitation_id, meal_options) values ($1, array['Vegetarian', 'Non-vegetarian'])", [inv.published]);
  });

  test.afterAll(async () => {
    await db.close();
  });

  test("guests (public key) and signed-in users can't call it", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      const message = await as(db, role, role === "authenticated" ? owner : null, () =>
        errorOf(db.query("select public.submit_rsvp('ana-and-rui', null, 'Spam', true, 1, null, null, null)")));
      expect(message, role).toMatch(/permission denied/);
    }
  });

  test("stores a reply against the invitation named by the slug, tidied", async () => {
    const { id } = (await submit({ slug: "Ana-And-Rui", meal: " Vegetarian ", message: "  See you!  " })).rows[0];
    const row = await one("select invitation_id, guest_name, attending, party_size, meal_preference, message, ip_hash, email, dietary from public.rsvps where id = $1", [id]);
    expect(row).toEqual({
      invitation_id: inv.published, guest_name: "Guest Name", attending: true, party_size: 2,
      meal_preference: "Vegetarian", message: "See you!", ip_hash: HASH_A, email: null, dietary: null,
    });
  });

  test("a decline is stored with no guests and no meal, whatever was sent", async () => {
    const { id } = (await submit({ attending: false, party: 3, meal: "Vegetarian", ip: null })).rows[0];
    expect(await one("select attending, party_size, meal_preference from public.rsvps where id = $1", [id]))
      .toEqual({ attending: false, party_size: 0, meal_preference: null });
  });

  test("only published, unlisted invitations take replies", async () => {
    expect(await errorOf(submit({ slug: "still-a-draft" }))).toMatch(/rsvp:not_found/);
    expect(await errorOf(submit({ slug: "nobody-here" }))).toMatch(/rsvp:not_found/);
    await db.query("update public.invitations set status = 'archived' where id = $1", [inv.other]);
    expect(await errorOf(submit({ slug: "someone-else" }))).toMatch(/rsvp:not_found/);
    await db.query("update public.invitations set status = 'published', access_mode = 'passcode', access_code_hash = 'x' where id = $1", [inv.other]);
    expect(await errorOf(submit({ slug: "someone-else" }))).toMatch(/rsvp:not_found/);
    await db.query("update public.invitations set access_mode = 'unlisted', access_code_hash = null where id = $1", [inv.other]);
  });

  test("guest count: 1–50 when attending, stored as 0 when declining", async () => {
    expect(await errorOf(submit({ party: 51 }))).toMatch(/rsvp:invalid \(party size\)/);
    expect(await errorOf(submit({ party: 0 }))).toMatch(/rsvp:invalid/);
    expect(await errorOf(submit({ party: -3 }))).toMatch(/rsvp:invalid/);
    expect(await errorOf(submit({ attending: null }))).toMatch(/rsvp:invalid/);
    const fifty = (await submit({ party: 50, ip: null })).rows[0].id;
    expect(await one("select party_size from public.rsvps where id = $1", [fifty])).toEqual({ party_size: 50 });
    // Same limit on an invitation with no settings at all.
    expect(await errorOf(submit({ slug: "someone-else", party: 50, ip: null }))).toBeNull();
    expect(await errorOf(submit({ slug: "someone-else", party: 51 }))).toMatch(/rsvp:invalid/);
  });

  test("the table itself refuses impossible guest counts, whoever writes", async () => {
    const insert = (attending: boolean, party: number) =>
      errorOf(db.query("insert into public.rsvps (invitation_id, guest_name, attending, party_size) values ($1, 'Direct', $2, $3)", [inv.published, attending, party]));
    expect(await insert(true, 51)).toMatch(/rsvps_guest_count/);
    expect(await insert(true, 0)).toMatch(/rsvps_guest_count/);
    expect(await insert(false, 2)).toMatch(/rsvps_guest_count/);
    expect(await insert(true, 50)).toBeNull();
    expect(await insert(false, 0)).toBeNull();
  });

  test("meals: only the couple's options, and none where meals aren't asked", async () => {
    expect(await errorOf(submit({ meal: "Fish" }))).toMatch(/rsvp:invalid \(meal\)/);
    expect(await errorOf(submit({ meal: "vegetarian" }))).toMatch(/rsvp:invalid \(meal\)/);
    expect(await errorOf(submit({ slug: "someone-else", meal: "Vegetarian" }))).toMatch(/rsvp:invalid \(meal\)/);
    expect(await errorOf(submit({ meal: "  ", ip: null }))).toBeNull(); // blank = no preference
  });

  test("a retried submission returns the first reply instead of storing another", async () => {
    const submission = "6f1c2a7e-3b9d-4c1e-9a55-0d2b7e4f8a13";
    const first = (await submit({ submission, name: "Retry Guest", ip: null })).rows[0].id;
    const second = (await submit({ submission, name: "Retry Guest", ip: null })).rows[0].id;
    expect(second).toBe(first);
    expect((await one<{ n: number }>("select count(*)::int as n from public.rsvps where client_submission_id = $1", [submission])).n).toBe(1);
    // The same id on another invitation is a different reply.
    const elsewhere = (await submit({ slug: "someone-else", submission, ip: null })).rows[0].id;
    expect(elsewhere).not.toBe(first);
  });

  test("column rules still apply: name and hash format", async () => {
    expect(await errorOf(submit({ name: "   " }))).toMatch(/check constraint/);
    expect(await errorOf(submit({ name: "x".repeat(121) }))).toMatch(/check constraint/);
    expect(await errorOf(submit({ ip: "raw-ip-1.2.3.4" }))).toMatch(/check constraint/);
  });

  test("rate limit: 10 replies an hour per connection, per invitation", async () => {
    const ip = "c".repeat(64);
    for (let i = 0; i < 10; i++) expect(await errorOf(submit({ ip })), `reply ${i + 1}`).toBeNull();
    expect(await errorOf(submit({ ip }))).toMatch(/rsvp:rate_limited/);
    expect(await errorOf(submit({ ip, slug: "someone-else" }))).toBeNull(); // another invitation
    expect(await errorOf(submit({ ip: "d".repeat(64) }))).toBeNull(); // another connection
    await db.query("update public.rsvps set submitted_at = now() - interval '2 hours' where ip_hash = $1", [ip]);
    expect(await errorOf(submit({ ip }))).toBeNull(); // an hour later
  });

  test("an invitation stops taking replies at 2,000", async () => {
    await db.query(
      "insert into public.rsvps (invitation_id, guest_name, attending, party_size) select $1, 'Filler', true, 1 from generate_series(1, 2000 - (select count(*) from public.rsvps where invitation_id = $1)::int)",
      [inv.other]);
    expect(await errorOf(submit({ slug: "someone-else", ip: null }))).toMatch(/rsvp:full/);
  });

  test("rsvp_settings: valid meal lists only, and no guest-limit setting exists", async () => {
    const set = (meals: string) =>
      errorOf(db.query(`update public.rsvp_settings set meal_options = ${meals} where invitation_id = $1`, [inv.published]));
    expect(await set("array['Veg', 'veg']")).toMatch(/check constraint/);
    expect(await set("array[' Veg']")).toMatch(/check constraint/);
    expect(await set("array['']")).toMatch(/check constraint/);
    expect(await set(`array[${"'x',".repeat(6)}'y']`)).toMatch(/check constraint/);
    expect(await set("array[null]::text[]")).toMatch(/check constraint/);
    expect(await set("array['Vegetarian', 'Non-vegetarian']")).toBeNull();
    const { rows } = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'rsvp_settings' order by ordinal_position");
    expect(rows.map((r) => r.column_name)).toEqual(["invitation_id", "meal_options", "created_at", "updated_at"]);
  });

  test("rsvp_settings: couples read their own, only the studio writes, guests see nothing", async () => {
    const stranger = await createUser(db);
    const read = (user: string) =>
      as(db, "authenticated", user, async () => (await db.query("select invitation_id from public.rsvp_settings")).rows.length);
    expect(await read(owner)).toBe(1);
    expect(await read(stranger)).toBe(0);
    expect(await read(admin)).toBe(1);

    const ownerUpdate = await as(db, "authenticated", owner, async () =>
      (await db.query("update public.rsvp_settings set meal_options = '{}' where invitation_id = $1 returning 1", [inv.published])).rows.length);
    expect(ownerUpdate).toBe(0);
    expect(await as(db, "authenticated", owner, () =>
      errorOf(db.query("insert into public.rsvp_settings (invitation_id) values ($1)", [inv.other])))).toMatch(/row-level security/);
    expect(await as(db, "authenticated", admin, () =>
      errorOf(db.query("update public.rsvp_settings set meal_options = array['Vegetarian', 'Non-vegetarian', 'Vegan'] where invitation_id = $1", [inv.published])))).toBeNull();
    expect(await as(db, "anon", null, () => errorOf(db.query("select * from public.rsvp_settings")))).toMatch(/permission denied/);
  });

  test("the public read path carries the settings, or null without them", async () => {
    const read = (slug: string) =>
      as(db, "anon", null, async () =>
        (await db.query<{ r: { rsvpSettings: unknown } }>("select public.get_published_invitation($1) as r", [slug])).rows[0].r.rsvpSettings);
    expect(await read("ana-and-rui")).toEqual({ mealOptions: ["Vegetarian", "Non-vegetarian", "Vegan"] });
    expect(await read("someone-else")).toBeNull();
  });

  test("the couple can read the replies; another couple can't", async () => {
    const mine = await as(db, "authenticated", owner, async () =>
      (await db.query<{ n: number }>("select count(*)::int as n from public.rsvps where invitation_id = $1", [inv.published])).rows[0].n);
    expect(mine).toBeGreaterThan(0);
    const stranger = await createUser(db);
    const theirs = await as(db, "authenticated", stranger, async () =>
      (await db.query<{ n: number }>("select count(*)::int as n from public.rsvps")).rows[0].n);
    expect(theirs).toBe(0);
  });

  test("'send' is reserved", async () => {
    expect(await errorOf(invitation("send"))).toMatch(/reserved/);
  });
});
