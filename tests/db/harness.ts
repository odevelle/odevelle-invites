import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { fixtures } from "@/invitation/fixtures";

/*
 * A real Postgres (PGlite, Postgres compiled to WebAssembly) with Supabase's
 * auth/storage stand-ins and every migration applied, for testing constraints
 * and RLS without Docker or a cloud project.
 *
 * Fidelity: real SQL, real roles, real RLS. The stand-ins are minimal, and
 * PGlite runs a newer Postgres than Supabase, so final verification still
 * happens on the Supabase project itself.
 */

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");

export function migrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(migrationsDir, f));
}

/** What a Supabase project does when "grant API access to new tables automatically" is on. */
const AUTO_GRANTS_SQL = ["tables", "functions", "sequences"]
  .map((kind) => `alter default privileges in schema public grant all on ${kind} to anon, authenticated, service_role;`)
  .join("\n");

/**
 * `autoGrants` defaults to off, matching the ODEVELLE project. Turn it on to
 * prove the migrations also lock things down on a permissive project.
 */
export async function createTestDatabase(options: { seed?: boolean; autoGrants?: boolean } = {}): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(root, "tests", "db", "supabase-stubs.sql"), "utf8"));
  if (options.autoGrants) await db.exec(AUTO_GRANTS_SQL);
  for (const file of migrationFiles()) await db.exec(readFileSync(file, "utf8"));
  if (options.seed) await db.exec(buildSeedSql());
  return db;
}

type Role = "anon" | "authenticated" | "service_role";

/** Runs `fn` as an API role, optionally as a signed-in user (sets the JWT subject like PostgREST). */
export async function as<T>(db: PGlite, role: Role, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

/** The error message if the query fails, or null if it succeeds. */
export async function errorOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

export async function createUser(db: PGlite, options: { admin?: boolean; name?: string } = {}): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [`${crypto.randomUUID()}@example.test`, JSON.stringify({ full_name: options.name ?? "Test user" })],
  );
  const id = rows[0].id;
  if (options.admin) await db.query("update public.profiles set role = 'admin' where id = $1", [id]);
  return id;
}

/* ---------------------------------------------------------------- seed SQL */

export const DEMO_CLIENT_ID = "00000000-0000-4000-8000-0000000000de";

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replaceAll("'", "''")}'`;
};

type Rec = Record<string, unknown>;

/**
 * Some fixtures are copies of another (e.g. the draft copies Charlotte & Henry)
 * and share event/media ids, which a real database rightly refuses. Repeats get
 * a stable id derived from the invitation and the original id.
 */
function uniqueId(seen: Set<string>, invitationId: string, id: string): string {
  if (!seen.has(id)) {
    seen.add(id);
    return id;
  }
  const h = createHash("sha256").update(`${invitationId}:${id}`).digest("hex");
  const derived = `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
  seen.add(derived);
  return derived;
}

function fileBytes(path: string): number {
  const file = join(root, "public", "fixtures", path);
  return existsSync(file) ? statSync(file).size : 1;
}

/**
 * SQL that loads every fixture invitation (published and draft, including the
 * deliberately broken ones) under one demo client. The single source of truth
 * stays src/invitation/fixtures.ts; supabase/seed.sql is generated from this.
 */
export function buildSeedSql(): string {
  const out: string[] = [
    "-- Generated from src/invitation/fixtures.ts by tests/db/seed.spec.ts. Do not edit by hand:",
    "-- run `npm run db:seed:generate` after changing the fixtures.",
    "-- Demo data for development and preview projects. Do NOT load into production.",
    "begin;",
    "",
    `insert into public.clients (id, display_name, country_code) values (${lit(DEMO_CLIENT_ID)}, 'ODEVELLE demo invitations', null);`,
    "",
  ];

  const seen = new Set<string>();
  for (const { status, record } of fixtures) {
    const r = record as Rec;
    out.push(`-- ${r.slug} (${status})`);
    out.push(
      "insert into public.invitations (id, slug, client_id, status, package, occasion, design_id, design_version, title, locale, time_zone, primary_date, content, appearance, design_options, features, published_at) values (" +
        [
          r.id, r.slug, DEMO_CLIENT_ID, status, r.package, r.occasion, r.designId, r.designVersion, r.title, r.locale,
          r.timeZone, r.primaryDate, r.content, r.appearance, r.designOptions, r.features,
          status === "published" ? r.publishedAt : null,
        ].map(lit).join(", ") + ");",
    );
    for (const e of (r.events as Rec[]) ?? []) {
      out.push(
        "insert into public.invitation_events (id, invitation_id, kind, title, starts_at, ends_at, venue_name, address, latitude, longitude, map_url, dress_code, notes, rsvp_enabled, sort_order) values (" +
          [uniqueId(seen, String(r.id), String(e.id)), r.id, e.kind, e.title, e.startsAt, e.endsAt, e.venueName, e.address, e.latitude, e.longitude, e.mapUrl, e.dressCode, e.notes, e.rsvpEnabled, e.sortOrder]
            .map(lit).join(", ") + ");",
      );
    }
    for (const m of (r.media as Rec[]) ?? []) {
      out.push(
        "insert into public.invitation_media (id, invitation_id, kind, storage_path, mime_type, bytes, width, height, duration_ms, alt, blur_data_url, sort_order) values (" +
          [uniqueId(seen, String(r.id), String(m.id)), r.id, m.kind, m.path, m.mimeType, fileBytes(String(m.path)), m.width, m.height, m.durationMs, m.alt, m.blurDataUrl, m.sortOrder]
            .map(lit).join(", ") + ");",
      );
    }
    out.push("");
  }
  out.push("commit;", "");
  return out.join("\n");
}
