import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { createSupabaseRsvpSink } from "@/invitation/rsvp/supabase-sink";
import type { RsvpWrite } from "@/invitation/rsvp/sink";
import { as, createTestDatabase } from "./harness";

/*
 * The app's RSVP writer, using the real supabase-js client, answered by the
 * test database as PostgREST would: the RPC runs as service_role (the secret key).
 */

test.describe.configure({ mode: "default" });

const URL_ = "https://abcdefghijklmnop.supabase.co";
const KEY = "sb_secret_test_key_0123456789abcdef";

let db: PGlite;
const requests: { path: string; apikey: string | null }[] = [];

const PARAMS = ["p_slug", "p_client_submission_id", "p_guest_name", "p_attending", "p_party_size", "p_meal", "p_message", "p_ip_hash"];
const CALL = `select public.submit_rsvp(${PARAMS.map((p, i) => `${p} => $${i + 1}`).join(", ")}) as id`;

/** Minimal PostgREST for POST /rest/v1/rpc/submit_rsvp, with its error shape. */
const fakeFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  requests.push({ path: new URL(request.url).pathname, apikey: request.headers.get("apikey") });
  const body = (await request.json()) as Record<string, unknown>;
  if (body.p_slug === "simulate-outage") return Response.json({ code: "PGRST000", message: "Could not connect" }, { status: 503 });
  const args = PARAMS.map((p) => body[p]);
  try {
    const { rows } = await as(db, "service_role", null, () => db.query<{ id: string }>(CALL, args));
    return Response.json(rows[0].id);
  } catch (e) {
    const err = e as { code?: string; message: string };
    return Response.json({ code: err.code, message: err.message, details: null, hint: null }, { status: 400 });
  }
};

const write = (patch: Partial<RsvpWrite> = {}): RsvpWrite => ({
  slug: "ana-and-rui",
  guestName: "Guest",
  attending: true,
  partySize: 2,
  ipHash: "e".repeat(64),
  ...patch,
});

test.beforeAll(async () => {
  db = await createTestDatabase();
  const client = (await db.query<{ id: string }>("insert into public.clients (display_name) values ('C') returning id")).rows[0].id;
  const inv = (
    await db.query<{ id: string }>(
      `insert into public.invitations (slug, client_id, status, package, design_id, design_version, title, time_zone)
       values ('ana-and-rui', $1, 'published', 'signature', 'royal-luxury', 2, 'T', 'UTC') returning id`,
      [client],
    )
  ).rows[0].id;
  await db.query("insert into public.rsvp_settings (invitation_id, meal_options) values ($1, array['Vegetarian'])", [inv]);
});

test.afterAll(async () => {
  await db.close();
});

const sink = () => createSupabaseRsvpSink({ url: URL_, secretKey: KEY, fetch: fakeFetch });

test("writes a reply through submit_rsvp with the secret key", async () => {
  const submissionId = "6f1c2a7e-3b9d-4c1e-9a55-0d2b7e4f8a13";
  expect(await sink().submit(write({ meal: "Vegetarian", message: "Hello", submissionId }))).toEqual({ ok: true });
  expect(requests.at(-1)).toEqual({ path: "/rest/v1/rpc/submit_rsvp", apikey: KEY });
  // A retry with the same id is accepted and stores nothing new.
  expect(await sink().submit(write({ meal: "Vegetarian", message: "Hello", submissionId }))).toEqual({ ok: true });
  const { rows } = await db.query("select guest_name, party_size, meal_preference, message, client_submission_id from public.rsvps");
  expect(rows).toEqual([{ guest_name: "Guest", party_size: 2, meal_preference: "Vegetarian", message: "Hello", client_submission_id: submissionId }]);
});

test("maps each database refusal to what the guest is told", async () => {
  expect(await sink().submit(write({ slug: "nobody-here" }))).toEqual({ ok: false, reason: "not-found" });
  expect(await sink().submit(write({ partySize: 51 }))).toEqual({ ok: false, reason: "invalid" });
  expect(await sink().submit(write({ guestName: " " }))).toEqual({ ok: false, reason: "invalid" });
  expect(await sink().submit(write({ meal: "Fish" }))).toEqual({ ok: false, reason: "invalid" });
  expect(await sink().submit(write({ submissionId: "not-a-uuid" }))).toEqual({ ok: false, reason: "invalid" });

  const ip = "f".repeat(64);
  for (let i = 0; i < 10; i++) await sink().submit(write({ ipHash: ip }));
  expect(await sink().submit(write({ ipHash: ip }))).toEqual({ ok: false, reason: "rate-limited" });
});

test("an outage is 'unavailable', never mistaken for success", async () => {
  expect(await sink().submit(write({ slug: "simulate-outage" }))).toEqual({ ok: false, reason: "unavailable" });
});
