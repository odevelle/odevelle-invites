import { expect, test } from "@playwright/test";
import { getRedirectUrl, getRewrittenUrl, unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { routeRequest, type RouteDecision } from "@/lib/tenant/routing";
import { config, proxy } from "@/proxy";

const opts = { rootDomain: "odevelle.com", devRootDomains: ["localhost"] };
const route = (url: string, host = new URL(url).host): RouteDecision => {
  const u = new URL(url);
  return routeRequest({ host, pathname: u.pathname, search: u.search, protocol: u.protocol }, opts);
};

test.describe("routing rules", () => {
  test("an invitation's subdomain serves exactly its own invitation", () => {
    expect(route("https://chloe-shane.odevelle.com/")).toEqual({ action: "rewrite", pathname: "/sites/chloe-shane" });
    expect(route("https://Chloe-Shane.odevelle.com/?utm_source=whatsapp")).toEqual({ action: "rewrite", pathname: "/sites/chloe-shane" });
    expect(route("http://chloe-shane.localhost:3000/")).toEqual({ action: "rewrite", pathname: "/sites/chloe-shane" });
  });

  test("tenant isolation: another couple's path or the marketing pages can't be reached through a subdomain", () => {
    for (const path of ["/sites/rafael-isabel", "/sites/chloe-shane", "/features", "/admin", "/chloe-shane", "//sites/x"]) {
      expect(route(`https://chloe-shane.odevelle.com${path}`), path).toEqual({ action: "not-found" });
    }
  });

  test("reserved, nested and malformed subdomains are real 404s", () => {
    for (const host of ["admin.odevelle.com", "api.odevelle.com", "a.b.odevelle.com", "bad--slug.odevelle.com", "xn--jhn-moa.odevelle.com"]) {
      expect(route(`https://${host}/`), host).toEqual({ action: "not-found" });
    }
  });

  test("www redirects to the apex, keeping the path", () => {
    expect(route("https://www.odevelle.com/features?x=1")).toEqual({ action: "redirect", location: "https://odevelle.com/features?x=1" });
    expect(route("http://www.localhost:3000/")).toEqual({ action: "redirect", location: "http://localhost:3000/" });
  });

  test("/sites/{slug} on the production site redirects to the invitation's own address", () => {
    expect(route("https://odevelle.com/sites/chloe-shane")).toEqual({ action: "redirect", location: "https://chloe-shane.odevelle.com/" });
    expect(route("https://odevelle.com/sites/chloe-shane/")).toEqual({ action: "redirect", location: "https://chloe-shane.odevelle.com/" });
    for (const path of ["/sites", "/sites/", "/sites/admin", "/sites/Bad--Slug", "/sites/chloe-shane/extra"]) {
      expect(route(`https://odevelle.com${path}`), path).toEqual({ action: "not-found" });
    }
  });

  test("the marketing site is untouched", () => {
    for (const path of ["/", "/features", "/sitesmap"]) expect(route(`https://odevelle.com${path}`), path).toEqual({ action: "continue" });
  });

  test("local development and Vercel previews keep /sites/{slug} for previewing", () => {
    expect(route("http://localhost:3000/sites/chloe-shane")).toEqual({ action: "continue" });
    expect(route("https://odevelle-git-main-odevelle.vercel.app/sites/chloe-shane")).toEqual({ action: "continue" });
    expect(route("http://127.0.0.1:3000/")).toEqual({ action: "continue" });
  });

  test("a missing or garbage Host header is a 404", () => {
    expect(route("https://odevelle.com/", "")).toEqual({ action: "not-found" });
    expect(route("https://odevelle.com/", "évil.com")).toEqual({ action: "not-found" });
  });
});

test.describe("proxy.ts", () => {
  const call = async (url: string) => proxy(new NextRequest(url, { headers: { host: new URL(url).host } }));

  test("rewrites, redirects and 404s as the rules say", async () => {
    const rewrite = await call("https://chloe-shane.odevelle.com/?ref=1");
    expect(getRewrittenUrl(rewrite)).toBe("https://chloe-shane.odevelle.com/sites/chloe-shane?ref=1");
    expect(rewrite.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const redirect = await call("https://odevelle.com/sites/chloe-shane");
    expect(redirect.status).toBe(308);
    expect(getRedirectUrl(redirect)).toBe("https://chloe-shane.odevelle.com/");

    const missing = await call("https://admin.odevelle.com/");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(await missing.text()).toContain("We couldn’t find this invitation");

    expect(getRewrittenUrl(await call("https://odevelle.com/features"))).toBeNull();
  });

  test("account pages are served from the root domain only, never cached or indexed", async () => {
    for (const path of ["/login", "/dashboard", "/dashboard/chloe-shane", "/auth/confirm"]) {
      const response = await call(`https://odevelle.com${path}`);
      expect(response.status, path).toBe(200);
      expect(response.headers.get("cache-control"), path).toBe("private, no-store");
      expect(response.headers.get("x-robots-tag"), path).toBe("noindex, nofollow");
    }
    // Marketing pages stay cacheable; invitation subdomains have no account pages.
    expect((await call("https://odevelle.com/features")).headers.get("cache-control")).toBeNull();
    expect((await call("https://chloe-shane.odevelle.com/dashboard")).status).toBe(404);
    expect((await call("https://chloe-shane.odevelle.com/login")).status).toBe(404);
  });

  test("runs for pages but not for Next's files or anything with an extension", () => {
    const runs = (url: string) => unstable_doesMiddlewareMatch({ config, url });
    for (const url of ["/", "/features", "/sites/chloe-shane", "/anything/deep"]) expect(runs(url), url).toBe(true);
    for (const url of ["/_next/static/chunks/a.js", "/_next/image?url=%2Fx.webp&w=64&q=75", "/designs/royal-luxury/v2/hero.webp", "/fixtures/a/gallery/r1.webp", "/icon-abc.svg", "/__nextjs_original-stack-frames"]) {
      expect(runs(url), url).toBe(false);
    }
  });
});
