import { expect, test } from "./fixtures";

const designs = ["Royal Luxury", "Azulejo", "Embroidered Garden", "Pearl Shore"];

test.describe("Collection and design preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("lists the four designs, in order", async ({ page }) => {
    const cards = page.locator("#designs [role=listitem]");
    await expect(cards).toHaveCount(4);

    // The looping row rotates, so compare starting from wherever it has got to.
    const titles = await cards.locator("h3").allTextContents();
    const from = titles.indexOf(designs[0]);
    expect(from, `expected one card to be "${designs[0]}", got ${titles.join(", ")}`).toBeGreaterThanOrEqual(0);
    expect([...titles.slice(from), ...titles.slice(0, from)]).toEqual(designs);
  });

  test("opens the preview, cycles designs and closes", async ({ page }) => {
    await page.getByRole("button", { name: "Preview the Royal Luxury invitation" }).last().click();
    const dialog = page.getByRole("dialog", { name: "Invitation preview" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Royal Luxury");
    await expect(dialog).toContainText("Wedding collection · 01 / 04");

    await dialog.getByRole("button", { name: "Next design" }).click();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Azulejo");
    await dialog.getByRole("button", { name: "Previous design" }).click();
    await dialog.getByRole("button", { name: "Previous design" }).click();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Pearl Shore");
    await expect(dialog).toContainText("04 / 04");

    await dialog.getByRole("button", { name: "Close preview" }).click();
    await expect(dialog).toBeHidden();
  });

  test("Royal Luxury links to its live invitations and previews the real thing in each colourway", async ({ page }) => {
    const card = page.locator('#designs [role=listitem][aria-label="Royal Luxury invitation"]');
    await expect(card.getByRole("link", { name: /Cherry red/ })).toHaveAttribute("href", "/sites/rafael-isabel");
    await expect(card.getByRole("link", { name: /Sage green/ })).toHaveAttribute("href", "/sites/chloe-shane");

    await page.getByRole("button", { name: "Preview the Royal Luxury invitation" }).last().click();
    const dialog = page.getByRole("dialog", { name: "Invitation preview" });
    const live = dialog.locator("iframe");
    await expect(live).toHaveAttribute("src", "/sites/rafael-isabel");
    await expect(page.frameLocator("iframe").getByRole("button", { name: /open the invitation from rafael & isabel/i })).toBeVisible();

    await dialog.getByRole("button", { name: "Sage green" }).click();
    await expect(dialog.getByRole("button", { name: "Sage green" })).toHaveAttribute("aria-pressed", "true");
    await expect(live).toHaveAttribute("src", "/sites/chloe-shane");
    await expect(dialog.getByRole("link", { name: /View the full invitation/ })).toHaveAttribute("href", "/sites/chloe-shane");

    // Designs still in the studio keep the illustrated preview.
    await dialog.getByRole("button", { name: "Next design" }).click();
    await expect(live).toHaveCount(0);
  });

  test("closes with Escape", async ({ page }) => {
    await page.getByRole("button", { name: "Preview the Azulejo invitation" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Invitation preview" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("choosing a design pre-fills the enquiry form", async ({ page }) => {
    await page.getByRole("button", { name: "Preview the Embroidered Garden invitation" }).first().click();
    await page.getByRole("button", { name: "Choose this design" }).click();

    await expect(page.getByRole("dialog", { name: "Invitation preview" })).toBeHidden();
    await expect(page.locator("#begin-title")).toBeInViewport();
    await expect(page.locator("#begin")).toContainText("You have chosen Embroidered Garden. A beautiful place to begin.");
    await expect(page.getByLabel("The design you love")).toHaveValue("garden");
  });

  // The row loops by moving the card that has just left round to the end, so
  // what moves forward is the order, not the scroll position.
  const front = (page: import("@playwright/test").Page) =>
    page
      .locator("#designs [role=list]")
      .evaluate((el) => el.firstElementChild?.getAttribute("aria-label")?.replace(" invitation", "") ?? "");

  test("loops forward through the designs and never rewinds", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Wide screens show all four at once and stay still.");
    const row = page.locator("#designs [role=list]");
    await row.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5); // Hovering the row holds it.

    const seen: string[] = [await front(page)];
    const until = Date.now() + 15_000;
    while (Date.now() < until && seen.length < 5) {
      await page.waitForTimeout(150);
      const now = await front(page);
      if (now !== seen[seen.length - 1]) seen.push(now);
    }

    // Four steps: each design in turn, then back round to the one it started on.
    expect(seen).toHaveLength(5);
    const from = designs.indexOf(seen[0]);
    const expected = [...designs.slice(from), ...designs.slice(0, from)];
    expect(seen).toEqual([...expected, expected[0]]);

    // It only ever glides one card, so it never travels to the end to come back.
    expect(await row.evaluate((el) => el.scrollLeft)).toBeLessThan(
      await row.evaluate((el) => (el.scrollWidth - el.clientWidth) / 2),
    );
  });

  test("steps every 3.5s on a narrow screen", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Wide screens never move on their own.");
    await page.locator("#designs [role=list]").scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5);

    const start = await front(page);
    await page.waitForTimeout(4000);
    const once = await front(page);
    expect(once).not.toBe(start); // One step inside 4s.

    await page.waitForTimeout(4000);
    expect(await front(page)).not.toBe(once); // And another inside 8s.
  });

  test("holds while the visitor is on the row", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Wide screens never move on their own.");
    const row = page.locator("#designs [role=list]");
    await row.scrollIntoViewIfNeeded();

    await row.hover();
    const start = await front(page);
    await page.waitForTimeout(6000);
    expect(await front(page)).toBe(start);
  });

  test("never moves on its own at lg and up, even where the row overflows", async ({ page, isMobile }) => {
    test.skip(isMobile, "This is the wide-screen rule.");
    // 1280px is above lg but narrow enough that the four cards still overflow.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const row = page.locator("#designs [role=list]");
    await row.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5);

    expect(await row.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(1);
    const start = await front(page);
    const left = await row.evaluate((el) => el.scrollLeft);
    await page.waitForTimeout(8000);
    expect(await front(page)).toBe(start);
    expect(await row.evaluate((el) => el.scrollLeft)).toBe(left);
  });

  test("the arrows step back and forward, and take over from the timer", async ({ page, isMobile }) => {
    test.skip(!isMobile, "The arrows only appear where the row can scroll.");
    const prev = page.getByRole("button", { name: "Show the previous design" });
    const next = page.getByRole("button", { name: "Show the next design" });
    await page.locator("#designs [role=list]").scrollIntoViewIfNeeded();

    // The first press hands control over, which also settles the starting
    // point: from here the row only moves when it is asked to.
    await next.click();
    await page.waitForTimeout(1200);
    const start = await front(page);
    const step = (by: number) => designs[(designs.indexOf(start) + by + designs.length) % designs.length];

    await prev.click();
    await expect.poll(() => front(page)).toBe(step(-1));
    await prev.click();
    await expect.poll(() => front(page)).toBe(step(-2));
    await next.click();
    await expect.poll(() => front(page)).toBe(step(-1));

    // And it stays where the visitor left it.
    await page.waitForTimeout(5000);
    expect(await front(page)).toBe(step(-1));
  });

  test("an interrupted step still ends square, not part way", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Wide screens never step on their own.");
    const row = page.locator("#designs [role=list]");
    await row.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5);

    // Grab the row mid-glide: the browser cancels the smooth scroll part way.
    for (let i = 0; i < 2; i++) {
      await page.waitForTimeout(3400);
      await row.hover();
      await page.waitForTimeout(500);
      await page.mouse.move(5, 5);
      await page.waitForTimeout(700);
      // It must come to rest on a card, never stranded between two.
      expect(await row.evaluate((el) => Math.round(el.scrollLeft))).toBe(0);
    }
  });

  test("offers no arrows once every design is in view", async ({ page, isMobile }) => {
    test.skip(isMobile, "This is the wide-screen rule.");
    const arrows = page.getByRole("button", { name: /Show the (next|previous) design/ });

    await page.setViewportSize({ width: 1280, height: 900 }); // Four cards overflow.
    await page.goto("/");
    await expect(arrows).toHaveCount(2);

    await page.setViewportSize({ width: 1440, height: 900 }); // All four fit.
    await expect(arrows).toHaveCount(0);
  });

  test("counts every press, even in quick succession", async ({ page, isMobile }) => {
    test.skip(!isMobile, "The arrows only appear where the row can scroll.");
    const prev = page.getByRole("button", { name: "Show the previous design" });
    const next = page.getByRole("button", { name: "Show the next design" });
    await page.locator("#designs [role=list]").scrollIntoViewIfNeeded();

    await next.click(); // Takes control, so nothing else moves the row.
    await page.waitForTimeout(1200);
    const start = await front(page);

    // Pressed faster than a glide takes: a press landing mid-glide must still
    // count once, not twice.
    await prev.click();
    await prev.click();
    await next.click();

    const expected = designs[(designs.indexOf(start) + designs.length - 1) % designs.length];
    await expect.poll(() => front(page)).toBe(expected);
    await page.waitForTimeout(1500);
    expect(await front(page)).toBe(expected);
  });
});
