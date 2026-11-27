import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { ACCESS_MODES, INVITATION_STATUSES, OCCASIONS, PACKAGE_TIERS, USER_ROLES } from "@/invitation/schema/identity";
import { MEDIA_KINDS, MEDIA_RULES } from "@/invitation/schema/media";
import { RESERVED_SLUGS } from "@/lib/tenant/reserved";
import { SLUG_PATTERN, SLUG_PATTERN_SQL } from "@/lib/tenant/slug";

/*
 * The database and the app each enforce the same rules. These tests read the
 * migrations and fail if the two drift apart.
 */

const dir = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .join("\n");

function sqlEnum(name: string): string[] {
  const match = sql.match(new RegExp(`create type public\\.${name}\\s+as enum \\(([^)]*)\\)`, "i"));
  if (!match) throw new Error(`enum ${name} not found in migrations`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test("enums match the TypeScript lists", () => {
  expect(sqlEnum("invitation_status")).toEqual([...INVITATION_STATUSES]);
  expect(sqlEnum("package_tier")).toEqual([...PACKAGE_TIERS]);
  expect(sqlEnum("occasion")).toEqual([...OCCASIONS]);
  expect(sqlEnum("access_mode")).toEqual([...ACCESS_MODES]);
  expect(sqlEnum("media_kind")).toEqual([...MEDIA_KINDS]);
  expect(sqlEnum("user_role")).toEqual([...USER_ROLES]);
});

test("slug format is identical in Postgres and TypeScript", () => {
  expect(SLUG_PATTERN.source).toBe(SLUG_PATTERN_SQL);
  expect(sql).toContain(`slug ~ '${SLUG_PATTERN_SQL}'`);
  expect(sql).toContain("position('--' in slug) = 0");
});

test("reserved slugs are identical in Postgres and TypeScript", () => {
  // Every migration that adds reserved slugs, in order.
  const blocks = [...sql.matchAll(/insert into public\.reserved_slugs \(slug\) values([\s\S]*?);/gi)];
  expect(blocks.length).toBeGreaterThan(0);
  const fromSql = blocks.flatMap((b) => [...b[1].matchAll(/\('([^']+)'\)/g)].map((m) => m[1])).sort();
  expect(fromSql).toEqual([...RESERVED_SLUGS].sort());
});

test("media type and size rules are identical in Postgres and TypeScript", () => {
  const check = sql.match(/constraint invitation_media_kind_type check \(([\s\S]*?)\n  \)\n\);/i)?.[1];
  expect(check, "invitation_media_kind_type constraint").toBeTruthy();
  for (const [kind, rule] of Object.entries(MEDIA_RULES)) {
    // Find the branch that lists this kind.
    const branch = check!.split(/\n\s*or /).find((b) => new RegExp(`'${kind}'`).test(b));
    expect(branch, `branch for ${kind}`).toBeTruthy();
    expect([...branch!.matchAll(/'([a-z]+\/[a-z0-9+.-]+)'/g)].map((m) => m[1]).sort(), `${kind} types`).toEqual([...rule.mimeTypes].sort());
    expect(branch, `${kind} size`).toContain(`bytes <= ${rule.maxBytes}`);
  }
});

test("every table has row level security enabled", () => {
  const tables = [...sql.matchAll(/create table public\.(\w+)/gi)].map((m) => m[1]);
  expect(tables.length).toBeGreaterThan(0);
  for (const t of tables) expect(sql, t).toMatch(new RegExp(`alter table public\\.${t}\\s+enable row level security`, "i"));
});

test("anon can execute only the public read function", () => {
  const anonGrants = [...sql.matchAll(/grant execute on function ([\w.]+)\([^)]*\) to ([^;]+);/gi)]
    .filter((m) => /\banon\b/.test(m[2]))
    .map((m) => m[1]);
  expect(anonGrants).toEqual(["public.get_published_invitation"]);
  expect(sql).not.toMatch(/grant (select|insert|update|delete|all)[^;]* to [^;]*\banon\b/i);
});

test("security definer functions pin search_path", () => {
  const definers = [...sql.matchAll(/create function ([\w.]+)\([\s\S]*?as \$\$/gi)].filter((m) => /security definer/i.test(m[0]));
  expect(definers.length).toBeGreaterThan(0);
  for (const m of definers) expect(m[0], m[1]).toMatch(/set search_path = ''/i);
});
