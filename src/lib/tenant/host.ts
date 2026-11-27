import { isUsableSlug } from "./slug";

/**
 * Classifies an incoming Host header. Pure and synchronous: it runs in
 * `proxy.ts` on every request, so it must never do I/O.
 *
 * Whether an invitation with that slug exists is NOT decided here; the page
 * resolves it against the database (cached), and unknown slugs 404 there.
 */
export type HostResolution =
  /** One of our roots: the marketing site. */
  | { kind: "marketing"; rootDomain: string }
  | { kind: "redirect-to-apex"; rootDomain: string }
  /** `{slug}.{root}` with a usable slug. */
  | { kind: "invitation"; slug: string; rootDomain: string }
  /** A domain that isn't ours, e.g. a Vercel preview URL or 127.0.0.1. Served as-is. */
  | { kind: "external" }
  /** Malformed, or a subdomain of ours that can't be an invitation (reserved, nested, bad slug). */
  | { kind: "invalid" };

export type HostOptions = {
  /** Production root, e.g. "odevelle.com". */
  rootDomain: string;
  /** Extra roots treated like the production root (local dev: "localhost"). */
  devRootDomains?: readonly string[];
};

export function resolveHost(rawHost: string | null | undefined, options: HostOptions): HostResolution {
  if (!rawHost) return { kind: "invalid" };

  const host = stripPort(rawHost.trim().toLowerCase());
  // Reject IDN/punycode and anything that is not plain ASCII hostname characters.
  if (!/^[a-z0-9.-]+$/.test(host) || host.split(".").some((label) => label.startsWith("xn--"))) {
    return { kind: "invalid" };
  }

  const roots = [options.rootDomain, ...(options.devRootDomains ?? [])].map((r) => r.toLowerCase());

  for (const root of roots) {
    if (host === root) return { kind: "marketing", rootDomain: root };
    if (host === `www.${root}`) return { kind: "redirect-to-apex", rootDomain: root };

    const suffix = `.${root}`;
    if (host.endsWith(suffix)) {
      const label = host.slice(0, -suffix.length);
      // Exactly one label: "a.b.odevelle.com" is not an invitation.
      if (label.includes(".")) return { kind: "invalid" };
      return isUsableSlug(label) ? { kind: "invitation", slug: label, rootDomain: root } : { kind: "invalid" };
    }
  }

  // Not one of our domains (future: custom domains are resolved here).
  return { kind: "external" };
}

function stripPort(host: string): string {
  // IPv6 literals are never valid for us; the character check above rejects "[".
  const colon = host.lastIndexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}
