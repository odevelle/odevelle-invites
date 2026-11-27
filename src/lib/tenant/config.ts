/*
 * Tenant domain configuration. Not secret and not `server-only`, because
 * proxy.ts reads it on every request.
 */

/** Local roots that behave like the production root: `{slug}.localhost:3000` opens an invitation. */
export const DEV_ROOT_DOMAINS = ["localhost"] as const;

const ROOT_DOMAIN_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

let cached: string | undefined;

/** The production root (`ROOT_DOMAIN`, default `odevelle.com`). Throws on a malformed value. */
export function getRootDomain(): string {
  if (cached) return cached;
  const value = (process.env.ROOT_DOMAIN ?? "odevelle.com").trim().toLowerCase();
  if (!ROOT_DOMAIN_PATTERN.test(value)) {
    throw new Error(`ROOT_DOMAIN must be a bare hostname such as odevelle.com (got "${value}")`);
  }
  return (cached = value);
}
