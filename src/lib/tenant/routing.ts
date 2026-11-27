import { resolveHost, type HostOptions } from "./host";
import { isUsableSlug } from "./slug";

/*
 * What proxy.ts does with a request, as a pure function of host and path.
 *
 *   www.{root}/…              308 → {root}/…
 *   {slug}.{root}/            rewrite → /sites/{slug} (the URL bar keeps the subdomain)
 *   {slug}.{root}/anything    404: an invitation is one page, and /sites/{other}
 *                             can never be reached through another couple's host
 *   {root}/sites/{slug}       308 → {slug}.{root}/ (production root only; one address per invitation)
 *   {root}/sites/…            404 for anything else under /sites
 *   reserved / nested / malformed subdomains → 404
 *   dev roots (localhost) and other domains (Vercel previews) → served as-is, /sites/* included
 *
 * Requests for files (paths with an extension) and /_next/* never get here:
 * see the matcher in proxy.ts. Theme artwork and media load on any host.
 */

export type RouteDecision =
  | { action: "continue" }
  | { action: "rewrite"; pathname: string }
  | { action: "redirect"; location: string }
  | { action: "not-found" };

export type RouteRequest = {
  host: string | null;
  pathname: string;
  /** Including the leading "?", or "". */
  search: string;
  protocol: string;
};

const SITES_PATH = /^\/sites(?:\/|$)/;
const SITES_SLUG_PATH = /^\/sites\/([^/]+)\/?$/;

export function routeRequest(request: RouteRequest, options: HostOptions): RouteDecision {
  const resolution = resolveHost(request.host, options);
  const isProductionRoot = (root: string) => root === options.rootDomain.toLowerCase();
  const origin = (host: string, root: string) =>
    isProductionRoot(root) ? `https://${host}` : `${request.protocol.replace(/:?$/, ":")}//${host}${portSuffix(request.host)}`;

  switch (resolution.kind) {
    case "invalid":
      return { action: "not-found" };

    case "external":
      return { action: "continue" };

    case "redirect-to-apex":
      return { action: "redirect", location: `${origin(resolution.rootDomain, resolution.rootDomain)}${request.pathname}${request.search}` };

    case "invitation":
      return request.pathname === "/"
        ? { action: "rewrite", pathname: `/sites/${resolution.slug}` }
        : { action: "not-found" };

    case "marketing": {
      if (!SITES_PATH.test(request.pathname) || !isProductionRoot(resolution.rootDomain)) return { action: "continue" };
      const slug = SITES_SLUG_PATH.exec(request.pathname)?.[1];
      return slug && isUsableSlug(slug)
        ? { action: "redirect", location: `${origin(`${slug}.${resolution.rootDomain}`, resolution.rootDomain)}/${request.search}` }
        : { action: "not-found" };
    }
  }
}

function portSuffix(host: string | null): string {
  const port = host?.match(/:(\d+)$/)?.[1];
  return port ? `:${port}` : "";
}
