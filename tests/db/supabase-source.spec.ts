import type { PGlite } from "@electric-sql/pglite";
import { expect, test } from "@playwright/test";
import { fixtureSource } from "@/invitation/fixtures";
import { createSupabaseSource, storagePublicUrl } from "@/invitation/supabase-source";
import { as, createTestDatabase } from "./harness";

/*
 * The app's Supabase source, using the real supabase-js client, answered by
 * the test database as PostgREST would: RPCs run as `anon`.
 */

test.describe.configure({ mode: "default" });

const URL_ = "https://abcdefghijklmnop.supabase.co";
const KEY = "sb_publishable_test_key_0123456789";

let db: PGlite;
const requests: { url: string; apikey: string | null; body: unknown }[] = [];

/** Minimal PostgREST: POST /rest/v1/rpc/get_published_invitation, as anon. */
const fakeFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const body: unknown = await request.json();
  requests.push({ url: request.url, apikey: request.headers.get("apikey"), body });
  if (new URL(request.url).pathname === "/rest/v1/rpc/broken") {
    return Response.json({ code: "PGRST000", message: "down" }, { status: 503 });
  }
  const { p_slug } = body as { p_slug: string };
  const { rows } = await as(db, "anon", null, () =>
    db.query<{ r: unknown }>("select public.get_published_invitation($1) as r", [p_slug]));
  return Response.json(rows[0].r);
};

test.beforeAll(async () => {
  db = await createTestDatabase({ seed: true });
});

test.afterAll(async () => {
  await db.close();
});

test("reads a published invitation through the RPC, with the publishable key", async () => {
  const source = createSupabaseSource({ url: URL_, publishableKey: KEY, fetch: fakeFetch });
  const record = (await source.getPublishedRecord("amelia-oliver")) as { slug: string; title: string };
  const fixture = (await fixtureSource.getPublishedRecord("amelia-oliver")) as { title: string };
  expect(record.slug).toBe("amelia-oliver");
  expect(record.title).toBe(fixture.title);
  expect(requests.at(-1)).toEqual({ url: `${URL_}/rest/v1/rpc/get_published_invitation`, apikey: KEY, body: { p_slug: "amelia-oliver" } });
});

test("unknown and draft slugs come back as null", async () => {
  const source = createSupabaseSource({ url: URL_, publishableKey: KEY, fetch: fakeFetch });
  expect(await source.getPublishedRecord("nobody-here")).toBeNull();
  expect(await source.getPublishedRecord("draft-invitation")).toBeNull();
});

test("an outage throws instead of looking like 'not found'", async () => {
  const failing: typeof fetch = (input, init) =>
    fakeFetch(String(input).replace("get_published_invitation", "broken"), init);
  const source = createSupabaseSource({ url: URL_, publishableKey: KEY, fetch: failing });
  await expect(source.getPublishedRecord("amelia-oliver")).rejects.toThrow(/get_published_invitation failed/);
});

test("media URLs point at the public bucket on the CDN", () => {
  expect(storagePublicUrl(`${URL_}/`, "c5fc827d-5b16-4778-9d3e-6f8bb2f7ed03/gallery/r 1.webp")).toBe(
    `${URL_}/storage/v1/object/public/invitation-media/c5fc827d-5b16-4778-9d3e-6f8bb2f7ed03/gallery/r%201.webp`);
});
