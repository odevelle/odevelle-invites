import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { RSVP_RESPONSE_COLUMNS } from "@/lib/supabase/database.types";
import { as, createTestDatabase, createUser, errorOf } from "./harness";

/*
 * The couple dashboard's read side: rsvp_summary() and the rsvp_responses
 * view, as the signed-in couple (authenticated + RLS). Runs with Supabase's
 * automatic API grants off and on.
 */

test.describe.configure({ mode: "default" });

type Summary = { total: number; attending: number; declined: number; guests: number };

for (const autoGrants of [false, true]) test.describe(`automatic API grants ${autoGrants ? "on" : "off"}`, () => {
  let db: PGlite;
  let alice: string;
  let bob: string;
  let admin: string;
  const inv = { aliceWedding: "", aliceEngagement: "", bob: "" };

  const one = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0];

  async function invitation(clientId: string, slug: string) {
    return (await one<{ id: string }>(
      `insert into public.invitations (slug, client_id, status, package, design_id, design_version, title, time_zone)
       values ($1, $2, 'published', 'signature', 'royal-luxury', 2, $1, 'UTC') returning id`, [slug, clientId])).id;
  }

  async function reply(invitationId: string, name: string, attending: boolean, party: number, minutesAgo = 0) {
    await db.query(
      "insert into public.rsvps (invitation_id, guest_name, attending, party_size, submitted_at, ip_hash) values ($1, $2, $3, $4, now() - make_interval(mins => $5), $6)",
      [invitationId, name, attending, party, minutesAgo, "a".repeat(64)]);
  }

  const summary = (user: string | null, invitationId: string, role: "authenticated" | "anon" = "authenticated") =>
    as(db, role, user, async () => (await db.query<Summary>("select * from public.rsvp_summary($1)", [invitationId])).rows[0]);

  test.beforeAll(async () => {
    db = await createTestDatabase({ autoGrants });
    alice = await createUser(db);
    bob = await createUser(db);
    admin = await createUser(db, { admin: true });
    const aliceClient = (await one<{ id: string }>("insert into public.clients (owner_user_id, display_name) values ($1, 'Alice') returning id", [alice])).id;
    const bobClient = (await one<{ id: string }>("insert into public.clients (owner_user_id, display_name) values ($1, 'Bob') returning id", [bob])).id;
    inv.aliceWedding = await invitation(aliceClient, "alice-wedding");
    inv.aliceEngagement = await invitation(aliceClient, "alice-engagement");
    inv.bob = await invitation(bobClient, "bob-wedding");

    // The brief's worked example.
    await reply(inv.aliceWedding, "John", true, 2, 40);
    await reply(inv.aliceWedding, "Sarah", true, 4, 30);
    await reply(inv.aliceWedding, "Michael", false, 0, 20);
    await reply(inv.aliceWedding, "David", true, 3, 10);
    await reply(inv.aliceEngagement, "Priya", true, 5);
    await reply(inv.bob, "Zoë Ångström", true, 7);
    await reply(inv.bob, "john", false, 0);
  });

  test.afterAll(async () => {
    await db.close();
  });

  test("summary: replies vs guests, from the brief's example", async () => {
    expect(await summary(alice, inv.aliceWedding)).toEqual({ total: 4, attending: 3, declined: 1, guests: 9 });
  });

  test("summary: an invitation with no replies is all zeros", async () => {
    await db.query("delete from public.rsvps where invitation_id = $1", [inv.aliceEngagement]);
    expect(await summary(alice, inv.aliceEngagement)).toEqual({ total: 0, attending: 0, declined: 0, guests: 0 });
    await reply(inv.aliceEngagement, "Priya", true, 5);
  });

  test("summary stays right after new replies", async () => {
    await reply(inv.aliceEngagement, "Late Guest", false, 0);
    expect(await summary(alice, inv.aliceEngagement)).toEqual({ total: 2, attending: 1, declined: 1, guests: 5 });
  });

  test("summary: another couple's invitation gives zeros, never their numbers", async () => {
    expect(await summary(alice, inv.bob)).toEqual({ total: 0, attending: 0, declined: 0, guests: 0 });
    expect(await summary(bob, inv.aliceWedding)).toEqual({ total: 0, attending: 0, declined: 0, guests: 0 });
    expect(await summary(admin, inv.bob)).toEqual({ total: 2, attending: 1, declined: 1, guests: 7 });
  });

  test("guests (public key) can't run the summary or read the list", async () => {
    expect(await errorOf(summary(null, inv.aliceWedding, "anon"))).toMatch(/permission denied/);
    expect(await as(db, "anon", null, () => errorOf(db.query("select * from public.rsvp_responses")))).toMatch(/permission denied/);
  });

  test("list: a couple sees only their invitations' replies, with every invitation they own", async () => {
    const rows = await as(db, "authenticated", alice, async () =>
      (await db.query<{ invitation_id: string; guest_name: string }>("select invitation_id, guest_name from public.rsvp_responses order by guest_name")).rows);
    expect(new Set(rows.map((r) => r.invitation_id))).toEqual(new Set([inv.aliceWedding, inv.aliceEngagement]));
    expect(rows.map((r) => r.guest_name)).not.toContain("Zoë Ångström");
  });

  test("list: filter, case-insensitive search and newest-first paging", async () => {
    const page = await as(db, "authenticated", alice, async () =>
      (await db.query<{ guest_name: string }>(
        "select guest_name from public.rsvp_responses where invitation_id = $1 and attending order by submitted_at desc limit 2 offset 0", [inv.aliceWedding])).rows);
    expect(page.map((r) => r.guest_name)).toEqual(["David", "Sarah"]);

    const search = await as(db, "authenticated", alice, async () =>
      (await db.query<{ guest_name: string }>("select guest_name from public.rsvp_responses where invitation_id = $1 and guest_name ilike $2", [inv.aliceWedding, "%JOH%"])).rows);
    expect(search).toEqual([{ guest_name: "John" }]);

    // Bob's "john" stays invisible to Alice's search, and non-English names match as typed.
    const zoe = await as(db, "authenticated", bob, async () =>
      (await db.query<{ guest_name: string }>("select guest_name from public.rsvp_responses where guest_name ilike $1", ["%zoë%"])).rows);
    expect(zoe).toEqual([{ guest_name: "Zoë Ångström" }]);
  });

  test("list: same_name_count flags likely duplicates per invitation, whatever the filter", async () => {
    await reply(inv.aliceWedding, "  john ", false, 0);
    const rows = await as(db, "authenticated", alice, async () =>
      (await db.query<{ guest_name: string; same_name_count: number }>(
        "select guest_name, same_name_count from public.rsvp_responses where invitation_id = $1 and attending order by guest_name", [inv.aliceWedding])).rows);
    expect(rows).toEqual([
      { guest_name: "David", same_name_count: 1 },
      { guest_name: "John", same_name_count: 2 },
      { guest_name: "Sarah", same_name_count: 1 },
    ]);
  });

  test("list: the view exposes no private columns", async () => {
    const { rows } = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'rsvp_responses' order by ordinal_position");
    // Also the app's column list (src/lib/supabase/database.types.ts).
    expect(rows.map((r) => r.column_name)).toEqual([...RSVP_RESPONSE_COLUMNS]);
  });

  test("couples can delete their own spam replies, not another couple's, and can't edit any", async () => {
    const target = (await one<{ id: string }>("select id from public.rsvps where invitation_id = $1 and guest_name = '  john '", [inv.aliceWedding])).id;
    const bobTarget = (await one<{ id: string }>("select id from public.rsvps where invitation_id = $1 limit 1", [inv.bob])).id;
    await as(db, "authenticated", alice, async () => {
      expect((await db.query("delete from public.rsvps where id = $1 returning id", [bobTarget])).rows).toHaveLength(0);
      expect((await db.query("update public.rsvps set party_size = 20 where invitation_id = $1 returning id", [inv.aliceWedding])).rows).toHaveLength(0);
      expect((await db.query("delete from public.rsvps where id = $1 returning id", [target])).rows).toHaveLength(1);
    });
  });
});
