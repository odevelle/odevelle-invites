import { expect, test } from "./fixtures";

test.describe("Features page", () => {
  test("renders the features overview as its own page", async ({ page }) => {
    await page.goto("/features");
    await expect(page).toHaveTitle("Features · ODEVELLE");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Everything your guests need, in one link.");

    const tiles = page.locator("#features ul > li");
    await expect(tiles).toHaveCount(8);
    for (const title of [
      "RSVP and your guest dashboard",
      "An opening to remember",
      "Countdown",
      "Venues and directions",
      "The day, in order",
      "Your song",
      "Gallery and story",
      "Shared in one link",
    ]) {
      await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();
    }

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("is no longer part of the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#features")).toHaveCount(0);
  });

  test("calls to action lead back to the landing page sections", async ({ page }) => {
    await page.goto("/features");
    await page.locator("#features").getByRole("link", { name: "See what each plan includes" }).click();
    await expect(page).toHaveURL(/\/#pricing$/);
    await expect(page.locator("#pricing-title")).toBeInViewport();
  });
});

test.describe("Page transitions", () => {
  test.beforeEach(async ({ page }) => {
    // Record every view transition the page starts, with its transition types.
    await page.addInitScript(() => {
      const w = window as unknown as { __vt: string[][] };
      w.__vt = [];
      const start = document.startViewTransition?.bind(document);
      if (!start) return;
      document.startViewTransition = ((arg: StartViewTransitionOptions | ViewTransitionUpdateCallback) => {
        w.__vt.push(typeof arg === "object" && arg?.types ? [...arg.types] : []);
        return start(arg as StartViewTransitionOptions);
      }) as typeof document.startViewTransition;
    });
  });

  const transitions = (page: import("@playwright/test").Page) =>
    page.evaluate(() => (window as unknown as { __vt: string[][] }).__vt);
  const supported = (page: import("@playwright/test").Page) =>
    page.evaluate(() => typeof document.startViewTransition === "function");

  test("glides down into /features and back up to the landing page", async ({ page }) => {
    // Wait for hydration: a click before React hydrates is a full page load, not an animated navigation.
    await page.goto("/", { waitUntil: "networkidle" });
    test.skip(!(await supported(page)), "View Transitions API not supported in this browser");

    await page.getByRole("contentinfo").getByRole("link", { name: "Features" }).click();
    await expect(page).toHaveURL(/\/features$/);
    await expect.poll(() => transitions(page)).toEqual([["page-down"]]);
    expect(await page.evaluate(() => scrollY)).toBe(0);

    await page.getByRole("contentinfo").getByRole("link", { name: "Questions" }).click();
    await expect(page).toHaveURL(/\/#faq$/);
    await expect.poll(() => transitions(page)).toEqual([["page-down"], ["page-up"]]);
    await expect(page.locator("#faq-title")).toBeInViewport();
  });

  test("in-page links scroll without a page transition", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Pricing" }).click();
    await expect(page.locator("#pricing-title")).toBeInViewport();
    expect(await transitions(page)).toEqual([]);
  });
});

test.describe("Features navigation", () => {
  test("desktop header links to the features page and marks it current", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop header only");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name: "Features", exact: true }).click();
    await expect(page).toHaveURL(/\/features$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Features", exact: true })).toHaveAttribute("aria-current", "page");

    // Section links still work from the features page.
    await nav.getByRole("link", { name: "Questions", exact: true }).click();
    await expect(page).toHaveURL(/\/#faq$/);
    await expect(page.locator("#faq-title")).toBeInViewport();
  });

  test("mobile menu links to the features page", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile menu only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Features" }).click();
    await expect(page).toHaveURL(/\/features$/);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("footer links to the features page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Features" }).click();
    await expect(page).toHaveURL(/\/features$/);
  });
});
