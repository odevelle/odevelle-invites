import { defineConfig } from "@playwright/test";

/**
 * Fast tests with no browser and no server:
 *   tests/unit  pure logic (schemas, entitlements, tenant parsing, SQL/TypeScript drift)
 *   tests/db    the Supabase migrations on real Postgres (PGlite, in-process):
 *               RLS, constraints, storage policies, the public read path, the seed
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["list"]],
});
