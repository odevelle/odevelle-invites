import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { as, createTestDatabase, createUser, errorOf } from "./harness";

/*
 * Table privileges and Row Level Security on real Postgres. The whole suite
 * runs twice: with Supabase's automatic API grants off and on.
 */

test.describe.configure({ mode: "default" });

const TABLES = [
  "profiles", "clients", "reserved_slugs", "invitations", "invitation_versions",
  "invitation_events", "invitation_media", "rsvps", "rsvp_event_responses",
] as const;

for (const autoGrants of [false, true]) test.describe(`automatic API grants ${autoGrants ? "on" : "off"}`, () => {
  let db: PGlite;
  let admin: string;
  let alice: string;
  let bob: string;
  let stranger: string;
  const ids = { aliceClient: "", bobClient: "", aliceInv: "", bobInv: "", aliceEvent: "", aliceRsvp: "", bobRsvp: "" };

  async function one<T>(sql: string, params: unknown[] = []): Promise<T> {
    const { rows } = await db.query<T>(sql, params);
    return rows[0];
  }

  /** Inserts a client with one published invitation, one event and one RSVP (as the superuser). */
  async function tenant(owner: string, slug: string) {
    const client = await one<{ id: string }>(
      "insert into public.clients (owner_user_id, display_name) values ($1, $2) returning id", [owner, slug]);
    const inv = await one<{ id: string }>(
      `insert into public.invitations (slug, client_id, status, package, design_id, design_version, title, time_zone)
       values ($1, $2, 'published', 'classic', 'royal-luxury', 2, $1, 'Europe/Lisbon') returning id`, [slug, client.id]);
    const event = await one<{ id: string }>(
      "insert into public.invitation_events (invitation_id, kind, title, starts_at) values ($1, 'ceremony', 'Ceremony', now()) returning id", [inv.id]);
    const rsvp = await one<{ id: string }>(
      "insert into public.rsvps (invitation_id, guest_name, attending, party_size) values ($1, 'A guest', true, 2) returning id", [inv.id]);
    await db.query(
      "insert into public.rsvp_event_responses (rsvp_id, event_id, invitation_id, attending, party_size) values ($1, $2, $3, true, 2)",
      [rsvp.id, event.id, inv.id]);
    return { client: client.id, inv: inv.id, event: event.id, rsvp: rsvp.id };
  }

  test.beforeAll(async () => {
    db = await createTestDatabase({ autoGrants });
    admin = await createUser(db, { admin: true, name: "Studio" });
    alice = await createUser(db, { name: "Alice" });
    bob = await createUser(db, { name: "Bob" });
    stranger = await createUser(db, { name: "No invitation" });
    const a = await tenant(alice, "alice-and-sam");
    const b = await tenant(bob, "bob-and-kim");
    Object.assign(ids, { aliceClient: a.client, bobClient: b.client, aliceInv: a.inv, bobInv: b.inv, aliceEvent: a.event, aliceRsvp: a.rsvp, bobRsvp: b.rsvp });
  });

  test.afterAll(async () => {
    await db.close();
  });

  test("every public table has RLS enabled", async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname");
    expect(rows.map((r) => r.relname).sort()).toEqual([...TABLES].sort());
    for (const r of rows) expect(r.relrowsecurity, r.relname).toBe(true);
  });

  test.describe("anon (guests, the public API key)", () => {
    test("cannot read, write or delete any table", async () => {
      for (const table of TABLES) {
        await as(db, "anon", null, async () => {
          expect(await errorOf(db.query(`select * from public.${table}`)), `select ${table}`).toMatch(/permission denied/);
          expect(await errorOf(db.query(`delete from public.${table}`)), `delete ${table}`).toMatch(/permission denied/);
        });
      }
      await as(db, "anon", null, async () => {
        expect(await errorOf(db.query(
          "insert into public.rsvps (invitation_id, guest_name, attending) values ($1, 'Spam', true)", [ids.aliceInv]))).toMatch(/permission denied/);
      });
    });

    test("cannot call the helper or trigger functions", async () => {
      const calls = [
        "select public.is_admin()",
        `select public.owns_invitation('${ids.aliceInv}')`,
        `select public.owns_storage_object('${ids.aliceInv}/gallery/x.webp')`,
        "select public.handle_new_user()",
        "select public.invitations_validate()",
        "select public.set_updated_at()",
      ];
      for (const sql of calls) {
        await as(db, "anon", null, async () => {
          expect(await errorOf(db.query(sql)), sql).toMatch(/permission denied/);
        });
      }
    });

    test("can read a published invitation only through get_published_invitation", async () => {
      const result = await as(db, "anon", null, () =>
        db.query<{ r: { slug: string } | null }>("select public.get_published_invitation('alice-and-sam') as r"));
      expect(result.rows[0].r?.slug).toBe("alice-and-sam");
    });
  });

  test.describe("signed-in clients", () => {
    const count = (table: string, user: string) =>
      as(db, "authenticated", user, async () =>
        (await db.query<{ n: number }>(`select count(*)::int as n from public.${table}`)).rows[0].n);

    test("see only their own client, invitations, events, RSVPs and answers", async () => {
      for (const table of ["clients", "invitations", "invitation_events", "rsvps", "rsvp_event_responses"]) {
        expect(await count(table, alice), `alice ${table}`).toBe(1);
        expect(await count(table, stranger), `stranger ${table}`).toBe(0);
      }
      const slugs = await as(db, "authenticated", alice, () => db.query<{ slug: string }>("select slug from public.invitations"));
      expect(slugs.rows).toEqual([{ slug: "alice-and-sam" }]);
    });

    test("cannot fetch another tenant's rows even by id", async () => {
      const rows = await as(db, "authenticated", alice, async () =>
        (await db.query("select * from public.rsvps where id = $1", [ids.bobRsvp])).rows);
      expect(rows).toEqual([]);
    });

    test("see only their own profile and cannot promote themselves", async () => {
      expect(await count("profiles", alice)).toBe(1);
      await as(db, "authenticated", alice, () => db.query("update public.profiles set role = 'admin' where id = $1", [alice]));
      const role = await one<{ role: string }>("select role from public.profiles where id = $1", [alice]);
      expect(role.role).toBe("client");
    });

    test("cannot read the reserved slug list", async () => {
      await as(db, "authenticated", alice, async () => {
        expect(await errorOf(db.query("select * from public.reserved_slugs"))).toMatch(/permission denied/);
      });
    });

    test("cannot create, edit or delete invitations (the studio manages them in V1)", async () => {
      await as(db, "authenticated", alice, async () => {
        expect(await errorOf(db.query(
          `insert into public.invitations (slug, client_id, package, design_id, design_version, title, time_zone)
           values ('sneaky', $1, 'exclusive', 'royal-luxury', 2, 'x', 'UTC')`, [ids.aliceClient]))).toMatch(/row-level security/);
        await db.query("update public.invitations set package = 'exclusive'");
        await db.query("delete from public.invitations");
        await db.query("update public.invitation_events set title = 'Hacked'");
      });
      const inv = await one<{ package: string }>("select package from public.invitations where id = $1", [ids.aliceInv]);
      expect(inv.package).toBe("classic");
      const ev = await one<{ title: string }>("select title from public.invitation_events where id = $1", [ids.aliceEvent]);
      expect(ev.title).toBe("Ceremony");
    });

    test("cannot insert RSVPs directly (guests will go through a server function)", async () => {
      await as(db, "authenticated", alice, async () => {
        expect(await errorOf(db.query(
          "insert into public.rsvps (invitation_id, guest_name, attending) values ($1, 'Fake', true)", [ids.aliceInv]))).toMatch(/permission denied/);
      });
    });

    test("can delete an RSVP on their own invitation, but not someone else's", async () => {
      await as(db, "authenticated", alice, async () => {
        await db.query("delete from public.rsvps where id = $1", [ids.bobRsvp]);
        await db.query("delete from public.rsvps where id = $1", [ids.aliceRsvp]);
      });
      expect((await db.query("select 1 from public.rsvps where id = $1", [ids.bobRsvp])).rows).toHaveLength(1);
      expect((await db.query("select 1 from public.rsvps where id = $1", [ids.aliceRsvp])).rows).toHaveLength(0);
      // Its per-event answers go with it.
      expect((await db.query("select 1 from public.rsvp_event_responses where rsvp_id = $1", [ids.aliceRsvp])).rows).toHaveLength(0);
    });
  });

  test.describe("admins (the studio)", () => {
    test("see every tenant", async () => {
      const n = await as(db, "authenticated", admin, async () =>
        (await db.query<{ n: number }>("select count(*)::int as n from public.invitations")).rows[0].n);
      expect(n).toBe(2);
    });

    test("create and edit invitations, events and media", async () => {
      await as(db, "authenticated", admin, async () => {
        const inv = await one<{ id: string }>(
          `insert into public.invitations (slug, client_id, package, design_id, design_version, title, time_zone)
           values ('studio-made', $1, 'signature', 'royal-luxury', 2, 'Studio made', 'Europe/London') returning id`, [ids.aliceClient]);
        await db.query("insert into public.invitation_events (invitation_id, kind, title, starts_at) values ($1, 'reception', 'Reception', now())", [inv.id]);
        await db.query(
          "insert into public.invitation_media (invitation_id, kind, storage_path, mime_type, bytes) values ($1, 'hero', $2, 'image/webp', 1000)", [inv.id, `${inv.id}/hero/a.webp`]);
        await db.query("update public.invitations set status = 'published' where id = $1", [inv.id]);
      });
      // The owner now sees it too.
      const slugs = await as(db, "authenticated", alice, () => db.query<{ slug: string }>("select slug from public.invitations order by slug"));
      expect(slugs.rows.map((r) => r.slug)).toEqual(["alice-and-sam", "studio-made"]);
    });

    test("promote users", async () => {
      await as(db, "authenticated", admin, () => db.query("update public.profiles set role = 'admin' where id = $1", [stranger]));
      expect((await one<{ role: string }>("select role from public.profiles where id = $1", [stranger])).role).toBe("admin");
      await db.query("update public.profiles set role = 'client' where id = $1", [stranger]);
    });

    test("version history is append-only, even for admins", async () => {
      await as(db, "authenticated", admin, async () => {
        await db.query("insert into public.invitation_versions (invitation_id, version, snapshot) values ($1, 1, '{}')", [ids.aliceInv]);
        expect(await errorOf(db.query("update public.invitation_versions set note = 'rewritten'"))).toMatch(/permission denied/);
        expect(await errorOf(db.query("delete from public.invitation_versions"))).toMatch(/permission denied/);
      });
      const v = await one<{ n: number; note: string | null }>(
        "select count(*)::int as n, max(note) as note from public.invitation_versions where invitation_id = $1", [ids.aliceInv]);
      expect(v).toEqual({ n: 1, note: null });
      // Owners read their own history.
      expect(await as(db, "authenticated", alice, async () =>
        (await db.query("select 1 from public.invitation_versions")).rows.length)).toBe(1);
    });
  });

  test("a new sign-up gets a client profile, never admin", async () => {
    const id = await createUser(db, { name: "Fresh" });
    expect(await one("select role, full_name from public.profiles where id = $1", [id])).toEqual({ role: "client", full_name: "Fresh" });
  });

  test("server code (service role) can manage data, but can't rewrite history", async () => {
    await as(db, "service_role", null, async () => {
      expect(await errorOf(db.query("select * from public.rsvps"))).toBeNull();
      expect(await errorOf(db.query("update public.invitation_versions set note = 'x'"))).toMatch(/permission denied/);
    });
  });
});
