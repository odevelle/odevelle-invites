import { expect, test } from "@playwright/test";
import { resolveHost } from "@/lib/tenant/host";
import { isReservedSlug } from "@/lib/tenant/reserved";
import { isUsableSlug, isWellFormedSlug } from "@/lib/tenant/slug";

const opts = { rootDomain: "odevelle.com", devRootDomains: ["localhost", "lvh.me"] };

test.describe("slug rules", () => {
  test("accepts DNS-label slugs", () => {
    for (const s of ["john-maria", "emily-james", "ab3", "a".repeat(63)]) expect(isWellFormedSlug(s), s).toBe(true);
  });

  test("rejects malformed slugs", () => {
    for (const s of ["ab", "-john", "john-", "John-Maria", "john_maria", "john--maria", "jöhn", "a".repeat(64), "john.maria", ""]) {
      expect(isWellFormedSlug(s), s).toBe(false);
    }
  });

  test("reserved subdomains are never usable", () => {
    for (const s of ["www", "api", "admin", "app", "mail", "odevelle"]) {
      expect(isReservedSlug(s), s).toBe(true);
      expect(isUsableSlug(s), s).toBe(false);
    }
  });
});

test.describe("host resolution", () => {
  test("apex and www", () => {
    expect(resolveHost("odevelle.com", opts)).toEqual({ kind: "marketing", rootDomain: "odevelle.com" });
    expect(resolveHost("ODEVELLE.COM:443", opts)).toEqual({ kind: "marketing", rootDomain: "odevelle.com" });
    expect(resolveHost("www.odevelle.com", opts)).toEqual({ kind: "redirect-to-apex", rootDomain: "odevelle.com" });
  });

  test("tenant subdomains, including local development roots", () => {
    expect(resolveHost("john-maria.odevelle.com", opts)).toEqual({ kind: "invitation", slug: "john-maria", rootDomain: "odevelle.com" });
    expect(resolveHost("John-Maria.odevelle.com", opts)).toEqual({ kind: "invitation", slug: "john-maria", rootDomain: "odevelle.com" });
    expect(resolveHost("john-maria.localhost:3000", opts)).toEqual({ kind: "invitation", slug: "john-maria", rootDomain: "localhost" });
    expect(resolveHost("john-maria.lvh.me:3000", opts)).toEqual({ kind: "invitation", slug: "john-maria", rootDomain: "lvh.me" });
  });

  test("domains that aren't ours are external, never invitations", () => {
    for (const h of ["odevelle-git-main.vercel.app", "127.0.0.1:3000", "evil.com", "odevelle.com.evil.com", "john-maria.odevelle.co"]) {
      expect(resolveHost(h, opts), h).toEqual({ kind: "external" });
    }
  });

  test("rejects malformed hosts and subdomains that can't be invitations", () => {
    for (const h of [
      "api.odevelle.com", // reserved
      "a.b.odevelle.com", // nested
      "xn--jhn-moa.odevelle.com", // punycode
      "john--maria.odevelle.com",
      "ab.odevelle.com", // too short
      "",
      null,
      "[::1]:3000",
    ]) {
      expect(resolveHost(h, opts), String(h)).toEqual({ kind: "invalid" });
    }
  });
});
