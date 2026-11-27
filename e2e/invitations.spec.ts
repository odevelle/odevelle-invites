import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/*
 * Invitation rendering engine, against the fixture invitations
 * (src/invitation/fixtures.ts). Themes are provisional mocks, so these tests
 * check behaviour and contracts, never pixels; they keep passing when the
 * final designs replace the mocks.
 */

const RENDERABLE = [
  { slug: "charlotte-henry", theme: "royal-luxury", version: "1", hosts: "Charlotte & Henry" },
  { slug: "amelia-oliver", theme: "royal-luxury", version: "1", hosts: "Amelia & Oliver" },
  { slug: "ines-tomas", theme: "portuguese", version: "1", hosts: "Inês" },
  { slug: "sofia-daniel", theme: "portuguese", version: "2", hosts: "Sofía & Daniel" },
  { slug: "elise-julien", theme: "floral", version: "1", hosts: "Élise & Julien" },
  { slug: "chiara-lorenzo", theme: "beach", version: "1", hosts: "Chiara & Lorenzo" },
  { slug: "maya-turns-30", theme: "beach", version: "1", hosts: "Maya" },
  { slug: "rafael-isabel", theme: "royal-luxury", version: "2", hosts: "Rafael & Isabel" },
  { slug: "leela-arjun", theme: "royal-luxury", version: "2", hosts: "Leela & Arjun" },
  { slug: "royal-luxury-reference", theme: "royal-luxury", version: "2", hosts: "Groom & Bride" },
  { slug: "chloe-shane", theme: "royal-luxury", version: "2", hosts: "Shane & Chloe" },
];

const open = async (page: Page, slug: string) => {
  await page.goto(`/sites/${slug}`);
  return page.locator(`[data-invitation="${slug}"]`);
};

const sections = (page: Page) =>
  page.locator("[data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));

test.describe("rendering every theme through the shared contract", () => {
  for (const f of RENDERABLE) {
    test(`${f.slug} renders ${f.theme} v${f.version}`, async ({ page }) => {
      const root = await open(page, f.slug);
      await expect(root).toHaveAttribute("data-theme", f.theme);
      await expect(root).toHaveAttribute("data-theme-version", f.version);
      await expect(root.locator('[data-section="hero"]')).toContainText(f.hosts);
      await expect(root.locator('[data-section="rsvp"]')).toBeVisible();
      await expect(root.locator('[data-section="events"]')).toBeVisible();

      // Unlisted, not indexed.
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);

      // Responsive: no sideways scrolling at this project's viewport.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("one theme, different couples", () => {
  test("Royal Luxury renders each couple's own palette, fonts and layout options", async ({ page }) => {
    const style = async (slug: string) => {
      const root = await open(page, slug);
      const main = root.locator("main");
      return {
        primary: await main.evaluate((el) => getComputedStyle(el).getPropertyValue("--inv-primary").trim()),
        headingFont: await main.evaluate((el) => getComputedStyle(el).getPropertyValue("--inv-heading-font").trim()),
        emblem: await root.locator("[data-emblem]").getAttribute("data-emblem"),
      };
    };
    const charlotte = await style("charlotte-henry");
    const amelia = await style("amelia-oliver");
    expect(charlotte).toMatchObject({ primary: "#9b1b30", emblem: "crest" });
    expect(amelia).toMatchObject({ primary: "#1c2a4a", emblem: "monogram" });
    expect(charlotte.headingFont).not.toBe(amelia.headingFont);
  });
});

test.describe("design versions", () => {
  test("invitations stay on the version they're pinned to", async ({ page }) => {
    const v1 = await open(page, "ines-tomas");
    await expect(v1).toHaveAttribute("data-theme-version", "1");
    await expect(v1.locator("[data-layout]")).toHaveCount(0);

    const v2 = await open(page, "sofia-daniel");
    await expect(v2).toHaveAttribute("data-theme-version", "2");
    await expect(v2.locator("main")).toHaveAttribute("data-layout", "side-tiles");
  });
});

test.describe("package entitlements", () => {
  test("Classic: no story or gallery, and a requested premium feature is dropped", async ({ page }) => {
    await open(page, "charlotte-henry"); // asks for music, Classic doesn't include it
    const s = await sections(page);
    expect(s).not.toContain("story");
    expect(s).not.toContain("gallery");
    expect(s).not.toContain("music");
  });

  test("Signature: story and gallery are shown", async ({ page }) => {
    await open(page, "amelia-oliver");
    expect(await sections(page)).toEqual(expect.arrayContaining(["story", "gallery"]));
    await expect(page.locator('[data-section="gallery"] img')).toHaveCount(2);
  });

  test("Exclusive: custom sections are shown", async ({ page }) => {
    await open(page, "elise-julien");
    await expect(page.locator('[data-section="custom"]')).toContainText("Getting to Provence");
  });

  test("an invitation can switch an included feature off", async ({ page }) => {
    await open(page, "maya-turns-30"); // countdown: false
    expect(await sections(page)).not.toContain("countdown");
  });

  test("the countdown fills in after hydration", async ({ page }) => {
    await open(page, "charlotte-henry");
    await expect(page.locator("[data-countdown-ready]")).toHaveAttribute("data-countdown-ready", "true");
  });
});

test.describe("missing and broken invitations", () => {
  for (const slug of ["does-not-exist", "draft-invitation", "admin"]) {
    test(`"${slug}" shows not found`, async ({ page }) => {
      await page.goto(`/sites/${slug}`);
      await expect(page.locator('[data-invitation-state="not-found"]')).toBeVisible();
      await expect(page.locator("[data-theme]")).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    });
  }

  for (const slug of ["broken-theme", "broken-content"]) {
    test(`"${slug}" shows unavailable without exposing details`, async ({ page, consoleErrors }) => {
      await page.goto(`/sites/${slug}`);
      await expect(page.locator('[data-invitation-state="unavailable"]')).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/theatre|invalid|hosts/i);
      // The browser logs the server error that triggered the boundary (React #441,
      // message omitted in production). Expected here; anything else still fails the test.
      const unexpected = consoleErrors.filter((e) => !/#441|Server Components render/.test(e));
      consoleErrors.splice(0, consoleErrors.length, ...unexpected);
    });
  }
});

test.describe("Royal Luxury v2 (released design)", () => {
  test("the envelope video loads only when the guest opens it, then reveals the invitation", async ({ page }) => {
    const video: string[] = [];
    page.on("request", (r) => r.url().includes("intro.mp4") && video.push(r.url()));
    await page.goto("/sites/rafael-isabel");
    const intro = page.locator(".rl2-intro");
    await expect(intro).toBeVisible();
    await expect(page.locator(".rl2-intro__media").first()).toBeVisible();
    // Paused on the poster: no video data yet, and the page behind can't scroll.
    expect(video).toHaveLength(0);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");

    await page.getByRole("button", { name: /open the invitation from rafael & isabel/i }).click();
    await expect(intro).toHaveCount(0, { timeout: 15_000 });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
    await expect(page.locator('[data-section="hero"] h1')).toHaveText("Rafael & Isabel");
  });

  test("with reduced motion, opening skips the video", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const video: string[] = [];
    page.on("request", (r) => r.url().includes("intro.mp4") && video.push(r.url()));
    await page.goto("/sites/rafael-isabel");
    await page.locator(".rl2-intro__tap").click();
    await expect(page.locator(".rl2-intro")).toHaveCount(0, { timeout: 5_000 });
    expect(video).toHaveLength(0);
    await context.close();
  });

  test("venues, schedule, countdown and the scratch card work", async ({ page }) => {
    await page.goto("/sites/royal-luxury-reference"); // no intro on this fixture
    await expect(page.locator(".rl2-intro")).toHaveCount(0);

    // One card per venue; events sharing a venue merge into one time span.
    const cards = page.locator(".rl2-card");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(1)).toContainText("17:00 – 20:00");
    await expect(cards.first().getByRole("link", { name: "Calendar" })).toHaveAttribute("href", /^data:text\/calendar/);
    await expect(cards.first().getByRole("link", { name: "Directions" })).toHaveAttribute("href", /google\.com\/maps/);

    // Every event appears in the order of the day.
    await expect(page.locator(".rl2-moment")).toHaveCount(5);

    // Seconds tick (the clock only runs while it's on screen).
    await page.locator('[data-section="countdown"]').scrollIntoViewIfNeeded();
    const seconds = page.locator(".rl2-countdown__unit").nth(3).locator(".rl2-countdown__value");
    await expect(page.locator("[data-countdown-ready]")).toHaveAttribute("data-countdown-ready", "true");
    const first = await seconds.textContent();
    await expect(seconds).not.toHaveText(first ?? "", { timeout: 3_000 });

    // No gallery: the scratch card reveals the date, and keyboard users have a button for it.
    const scratch = page.locator(".rl2-scratch");
    await expect(scratch).toHaveAttribute("data-state", "ready");
    await scratch.getByRole("button", { name: "Reveal the date" }).press("Enter");
    await expect(scratch).toHaveAttribute("data-state", "revealed");
    await expect(scratch.locator(".rl2-scratch__date")).toHaveText("10 . 12 . 2026");
  });

  test("a colourway swaps the artwork and ground colours, and opens without an intro until it has its own video", async ({ page }) => {
    await page.goto("/sites/rafael-isabel");
    await expect(page.locator(".rl2")).toHaveCSS("background-color", "rgb(93, 1, 10)");

    const video: string[] = [];
    page.on("request", (r) => r.url().includes("intro.mp4") && video.push(r.url()));
    await page.goto("/sites/chloe-shane");
    await expect(page.locator(".rl2-intro")).toHaveCount(0);
    await expect(page.locator(".rl2")).toHaveCSS("background-color", "rgb(75, 91, 69)");
    const heroSrc = await page.locator('[data-section="hero"] img').first().getAttribute("src");
    expect(decodeURIComponent(heroSrc ?? "")).toContain("/designs/royal-luxury/v2/colourways/sage-green/hero.webp");
    await expect(page.locator('[data-section="hero"] h1')).toHaveText("Shane & Chloe");
    expect(video).toHaveLength(0);
  });

  test("gallery photos are behind the scratch card", async ({ page }) => {
    await page.goto("/sites/rafael-isabel");
    await page.locator(".rl2-intro__tap").click();
    await expect(page.locator(".rl2-intro")).toHaveCount(0, { timeout: 15_000 });
    const scratch = page.locator('[data-section="gallery"] .rl2-scratch');
    await expect(scratch.locator("img")).toHaveCount(2);
    await scratch.getByRole("button", { name: "Reveal the photo" }).press("Enter");
    await expect(scratch).toHaveAttribute("data-state", "revealed");
    await expect(scratch.getByAltText("Rafael and Isabel at sunset in Fontainhas")).toBeVisible();
  });
});
