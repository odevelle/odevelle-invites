#!/usr/bin/env node
/*
 * Uploads the demo invitation media (public/fixtures/{invitation_id}/…) to the
 * invitation-media bucket, at the same paths the seed's invitation_media rows use.
 *
 * For development / preview projects that loaded supabase/seed.sql. Never run
 * it against production. Uses the SECRET key (Storage writes are admin-only),
 * read from the environment and never printed.
 *
 *   node --env-file=.env.local scripts/db/upload-fixture-media.mjs           # dry run: lists files
 *   node --env-file=.env.local scripts/db/upload-fixture-media.mjs --apply   # uploads (overwrites same paths)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "invitation-media";
const ROOT = join(process.cwd(), "public", "fixtures");
const TYPES = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".avif": "image/avif", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".mp4": "video/mp4", ".webm": "video/webm" };
const UUID_FOLDER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//;

const apply = process.argv.includes("--apply");
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY (e.g. node --env-file=.env.local …).");
  process.exit(1);
}

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : [full];
});

const files = walk(ROOT).map((full) => ({ full, path: relative(ROOT, full).split(sep).join("/") }));
for (const f of files) {
  if (!UUID_FOLDER.test(f.path)) throw new Error(`${f.path}: must live under an invitation id folder`);
  if (!TYPES[extname(f.path).toLowerCase()]) throw new Error(`${f.path}: type not allowed in the bucket`);
}

console.log(`${files.length} files → ${new URL(SUPABASE_URL).host} bucket "${BUCKET}"${apply ? "" : " (dry run; pass --apply to upload)"}`);
if (!apply) {
  for (const f of files) console.log(`  ${f.path}`);
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let failed = 0;
for (const f of files) {
  const { error } = await supabase.storage.from(BUCKET).upload(f.path, readFileSync(f.full), {
    contentType: TYPES[extname(f.path).toLowerCase()],
    cacheControl: "31536000",
    upsert: true,
  });
  console.log(`  ${error ? "✗" : "✓"} ${f.path}${error ? `: ${error.message}` : ""}`);
  if (error) failed++;
}
process.exit(failed ? 1 : 0);
