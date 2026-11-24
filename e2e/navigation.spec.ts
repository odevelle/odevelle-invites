import { expect, test } from "./fixtures";

test.describe("Desktop navigation", () => {
  test.skip(({ isMobile }) => isMobile, "desktop header only");

  test("shows the full header and scrolls to sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Designs", "How It Works", "Features", "Pricing", "Questions", "Contact", "Client login"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();

    await nav.getByRole("link", { name: "Pricing", exact: true }).click();
    await expect(page).toHaveURL(/#pricing$/);
    await expect(page.locator("#pricing-title")).toBeInViewport();
  });

  test("hides the mobile-only sticky action bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Message the studio on WhatsApp" })).toBeHidden();
  });
});

test.describe("Mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile menu only");

  test("collapses the header into a menu button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pricing" })).toBeHidden();
    await expect(page.locator("header").getByRole("link", { name: "Begin your invitation" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("opens, closes with Escape and returns focus", async ({ page }) => {
    await page.goto("/");
    const opener = page.getByRole("button", { name: "Open menu" });
    await opener.click();

    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(opener).toHaveAttribute("aria-expanded", "true");
    for (const label of ["Designs", "How It Works", "Features", "Pricing", "Questions", "Contact"]) {
      await expect(menu.getByRole("link", { name: label })).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("navigates to a section and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Questions" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect(page).toHaveURL(/#faq$/);
    await expect(page.locator("#faq-title")).toBeInViewport();
  });

  test("keeps the sticky action bar on screen while scrolling", async ({ page }) => {
    await page.goto("/");
    await page.locator("#pricing").scrollIntoViewIfNeeded();
    await expect(page.getByRole("link", { name: "Message the studio on WhatsApp" })).toBeInViewport();
  });
});
