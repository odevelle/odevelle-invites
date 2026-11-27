import "server-only";
import { z } from "zod";

/*
 * Server environment, validated with Zod. (ROOT_DOMAIN is read by
 * src/lib/tenant/config.ts instead, because proxy.ts needs it.)
 *
 * Parsed lazily (on first use) rather than at import, so the marketing site
 * keeps building before Supabase is configured. Each phase calls the getter
 * it needs; a missing or malformed variable throws a clear error there.
 *
 * Supabase key naming: the new "publishable" (sb_publishable_…) and "secret"
 * (sb_secret_…) keys go in these slots. Legacy anon / service_role JWTs also
 * work in the same slots.
 */

const supabasePublicEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const supabaseSecretEnvSchema = supabasePublicEnvSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(20),
});

function parse<T extends z.ZodType>(schema: T, label: string): z.infer<T> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const fields = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid ${label} environment: ${fields}`);
  }
  return result.data;
}

let supabasePublicEnv: z.infer<typeof supabasePublicEnvSchema> | undefined;
let supabaseSecretEnv: z.infer<typeof supabaseSecretEnvSchema> | undefined;

/** URL + publishable key: safe for public, RLS-restricted reads. */
export function getSupabasePublicEnv() {
  return (supabasePublicEnv ??= parse(supabasePublicEnvSchema, "Supabase"));
}

/** Includes the secret (service-role) key. Server-only; never pass to client components. */
export function getSupabaseSecretEnv() {
  return (supabaseSecretEnv ??= parse(supabaseSecretEnvSchema, "Supabase (secret)"));
}
