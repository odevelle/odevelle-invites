import { expect, test } from "./fixtures";

// Fixed clocks around the launch offer (ends 31 Dec 2026, 23:59:59 IST).
const DURING_OFFER = new Date("2026-12-01T12:00:00Z");
const LAST_SECOND = new Date("2026-12-31T23:59:59+05:30");
const AFTER_OFFER = new Date("2027-01-01T00:00:00+05:30");

test.describe("Pricing", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(DURING_OFFER);
    await page.goto("/#pricing");
  });

  const launchPrices = (page: import("@playwright/test").Page) => page.locator("#pricing").getByTestId("price");
  const regular = (page: import("@playwright/test").Page) => page.locator("#pricing").getByTestId("regular-price");

  test("defaults to GBP and switches currency", async ({ page }) => {
    const group = page.getByRole("group", { name: "Currency" });
    await expect(group.getByRole("button", { name: "GBP" })).toHaveAttribute("aria-pressed", "true");
    await expect(launchPrices(page)).toHaveText(["£99", "£130", "£299"]);
    await expect(regular(page)).toHaveText(["£145", "£190", "£430"]);

    const expected: Record<string, [string[], string[]]> = {
      USD: [["$99", "$175", "$330"], ["$145", "$250", "$475"]],
      EUR: [["€149", "€170", "€500"], ["€215", "€245", "€715"]],
      INR: [["₹7,500", "₹12,000", "₹25,000"], ["₹10,750", "₹17,150", "₹35,750"]],
    };
    for (const [code, [launch, full]] of Object.entries(expected)) {
      await group.getByRole("button", { name: code }).click();
      await expect(group.getByRole("button", { name: code })).toHaveAttribute("aria-pressed", "true");
      await expect(launchPrices(page)).toHaveText(launch);
      await expect(regular(page)).toHaveText(full);
    }
  });

  test("shows the launch offer: label, crossed-out regular price and end date", async ({ page }) => {
    const pricing = page.locator("#pricing");
    await expect(pricing.getByText("Launch offer: 30% off every invitation until 31 December")).toBeVisible();
    await expect(pricing.getByTestId("launch-label")).toHaveText(Array(3).fill("30% off · Launch offer"));
    await expect(pricing.locator("s")).toHaveCount(3);
    await expect(pricing.getByText("Launch price until 31 December")).toHaveCount(3);
    await expect(page.getByRole("region", { name: "Launch offer and highlights" }).first()).toContainText(
      "Launch offer: 30% off every invitation until 31 December",
    );
  });

  test("every launch price is at least 30% below its crossed-out price", async ({ page }) => {
    const toNumber = (s: string) => Number(s.replace(/[^0-9.]/g, ""));
    for (const code of ["GBP", "USD", "EUR", "INR"]) {
      await page.getByRole("group", { name: "Currency" }).getByRole("button", { name: code }).click();
      const launch = (await launchPrices(page).allTextContents()).map(toNumber);
      const full = (await regular(page).allTextContents()).map(toNumber);
      launch.forEach((price, i) => expect(1 - price / full[i], `${code} plan ${i}`).toBeGreaterThanOrEqual(0.3 - 1e-9));
    }
  });
});

test.describe("Launch offer end", () => {
  test("is still on in the last second of 31 December (IST)", async ({ page }) => {
    await page.clock.setFixedTime(LAST_SECOND);
    await page.goto("/#pricing");
    await expect(page.locator("#pricing").getByTestId("launch-label")).toHaveCount(3);
  });

  test("switches to regular prices once the offer has ended", async ({ page }) => {
    await page.clock.setFixedTime(AFTER_OFFER);
    await page.goto("/#pricing");
    const pricing = page.locator("#pricing");
    await expect(pricing.getByTestId("price")).toHaveText(["£145", "£190", "£430"]);
    await expect(pricing.getByTestId("launch-label")).toHaveCount(0);
    await expect(pricing.locator("s")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Launch offer");
  });
});

test.describe("Pricing comparison", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#pricing");
  });

  test("toggles the comparison table", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Compare every detail" });
    await toggle.click();
    await expect(page.locator("#compare-table tbody tr")).toHaveCount(11);
    const hide = page.getByRole("button", { name: "Hide the comparison" });
    await expect(hide).toHaveAttribute("aria-expanded", "true");
    await hide.click();
    await expect(page.locator("#compare-table")).toBeHidden();
  });
});

test.describe("FAQ", () => {
  test("keeps a single answer open at a time", async ({ page }) => {
    await page.goto("/#faq");
    const first = page.getByRole("button", { name: "Do I need to design anything myself?" });
    const second = page.getByRole("button", { name: "How long does my invitation take?" });

    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#faq-0")).toBeVisible();

    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#faq-1")).toContainText("Classic and Signature invitations arrive");

    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#faq-1")).toBeHidden();
  });
});
