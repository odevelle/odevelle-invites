/**
 * Subdomains that can never be an invitation slug.
 *
 * Kept in sync with the `reserved_slugs` table seeded by
 * `supabase/migrations/*_core_schema.sql`; a unit test fails if they drift.
 * Add new entries in both places (new migration + this list).
 */
export const RESERVED_SLUGS = [
  // Platform and infrastructure
  "www",
  "app",
  "admin",
  "api",
  "dashboard",
  "studio",
  "account",
  "accounts",
  "auth",
  "login",
  "signin",
  "signup",
  "billing",
  "checkout",
  "pay",
  "payments",
  // Mail and DNS conventions
  "mail",
  "email",
  "smtp",
  "send",
  "imap",
  "pop",
  "mx",
  "autodiscover",
  "autoconfig",
  "ns1",
  "ns2",
  // Assets and delivery
  "static",
  "assets",
  "cdn",
  "media",
  "images",
  "img",
  "files",
  "uploads",
  "storage",
  // Environments and tooling
  "dev",
  "staging",
  "preview",
  "test",
  "demo",
  "status",
  "docs",
  "help",
  "support",
  "blog",
  "shop",
  "store",
  // Brand
  "odevelle",
] as const;

const reserved: ReadonlySet<string> = new Set(RESERVED_SLUGS);

export function isReservedSlug(slug: string): boolean {
  return reserved.has(slug.toLowerCase());
}
