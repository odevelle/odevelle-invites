import { expect, test } from "./fixtures";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has the brand title and hero", async ({ page }) => {
    await expect(page).toHaveTitle("ODEVELLE · Digital Wedding Invitations, Designed by Hand");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Every love story deserves");
    await expect(page.getByRole("link", { name: "ODEVELLE, back to top" })).toBeVisible();
  });

  test("renders every section in the approved order", async ({ page }) => {
    const ids = await page
      .locator("main section[id], main section[aria-labelledby]")
      .evaluateAll((els) => els.map((el) => el.id || el.getAttribute("aria-labelledby")));
    expect(ids).toEqual([
      "hero-title",
      "collection",
      "how",
      "pricing",
      "why",
      "stories",
      "final-title",
      "faq",
      "begin",
      "subscribe",
    ]);
    await expect(page.locator("footer")).toContainText("© 2026 ODEVELLE. All rights reserved.");
  });

  test("does not overflow horizontally", async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("serves fonts from the app, not Google", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (req) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) external.push(req.url());
    });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    expect(external).toEqual([]);

    // [family, CSS font shorthand prefix for the style actually used on the page]
    const families = await page.evaluate(() =>
      (
        [
          ["Cormorant Garamond", ""],
          ["Inter", ""],
          ["Fraunces Variable", "italic 600 "],
          ["Bodoni Moda", ""],
          ["Manrope", ""],
          ["Great Vibes", ""],
        ] as const
      ).map(([f, style]) => [f, document.fonts.check(`${style}16px "${f}"`)]),
    );
    for (const [family, ok] of families) expect(ok, `${family} loaded`).toBe(true);
  });

  test("skip link targets the main content", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard navigation is a desktop concern");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute("href", "#main");
  });

  test("respects reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const animation = await page.locator(".animate-marquee").evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe("none");
    await context.close();
  });
});
