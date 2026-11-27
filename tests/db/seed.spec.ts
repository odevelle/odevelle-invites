import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { buildSeedSql } from "./harness";

/*
 * supabase/seed.sql is generated from src/invitation/fixtures.ts so demo data
 * has one source of truth. `npm run db:seed:generate` rewrites it; otherwise
 * this test fails when the fixtures have changed and the file hasn't.
 */

const seedFile = join(process.cwd(), "supabase", "seed.sql");

test("supabase/seed.sql is up to date with the fixtures", () => {
  const expected = buildSeedSql();
  if (process.env.UPDATE_SEED === "1") {
    writeFileSync(seedFile, expected);
    return;
  }
  expect(existsSync(seedFile), "run `npm run db:seed:generate`").toBe(true);
  expect(readFileSync(seedFile, "utf8"), "fixtures changed: run `npm run db:seed:generate`").toBe(expected);
});
