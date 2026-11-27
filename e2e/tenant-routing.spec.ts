import { expect, test } from "./fixtures";

/*
 * Multi-tenant routing through real subdomains. Locally `{slug}.localhost`
 * stands in for `{slug}.odevelle.com` (same rules; see src/lib/tenant/routing.ts).
 * Every test also fails on console errors, so broken assets or hydration on a
 * subdomain show up here.
 */

const local = (slug: string, path = "/") => {
  const url = new URL(test.info().project.use.baseURL ?? "http://localhost:3100");
  url.hostname = `${slug}.localhost`;
  url.pathname = path;
  return url.toString();
};

test.beforeEach(() => {
  const base = new URL(test.info().project.use.baseURL ?? "");
  test.skip(base.hostname !== "localhost", "subdomain tests need the local test server");
});

test("each couple's subdomain opens their own invitation, and the address stays put", async ({ page }) => {
  for (const { slug, theme } of [
    { slug: "chloe-shane", theme: "royal-luxury" },
    { slug: "sofia-daniel", theme: "portuguese" },
  ]) {
    const response = await page.goto(local(slug));
    expect(response?.status(), slug).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    await expect(page.locator(`[data-invitation="${slug}"]`)).toHaveAttribute("data-theme", theme);
    expect(new URL(page.url()).hostname).toBe(`${slug}.localhost`);
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
  }
});

/** The browser logs the document's own 404 as a console error; that one is expected here. */
const expectedNotFoundLogs = (errors: string[]) => {
  const rest = errors.filter((e) => !/status of 404/.test(e));
  errors.splice(0, errors.length, ...rest);
};

test("another couple's invitation can't be opened through someone's subdomain", async ({ page, consoleErrors }) => {
  for (const path of ["/sites/rafael-isabel", "/sites/chloe-shane", "/features"]) {
    const response = await page.goto(local("chloe-shane", path));
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { name: "We couldn’t find this invitation" })).toBeVisible();
    await expect(page.locator("[data-invitation]")).toHaveCount(0);
  }
  expectedNotFoundLogs(consoleErrors);
});

test("reserved subdomains are real 404s", async ({ page, consoleErrors }) => {
  for (const slug of ["admin", "api", "dashboard"]) {
    const response = await page.goto(local(slug));
    expect(response?.status(), slug).toBe(404);
  }
  expectedNotFoundLogs(consoleErrors);
});

test("unknown and unpublished invitations show the not-found page", async ({ page }) => {
  for (const slug of ["no-such-couple", "draft-invitation"]) {
    await page.goto(local(slug));
    await expect(page.getByRole("heading", { name: "We couldn’t find this invitation" }), slug).toBeVisible();
    await expect(page.locator("[data-invitation]")).toHaveCount(0);
    await expect(page.locator("meta[name=robots][content*=noindex]").first()).toBeAttached();
  }
});
