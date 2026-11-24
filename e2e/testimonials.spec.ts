import { testimonials } from "../src/content/marketing/testimonials";
import { expect, test } from "./fixtures";

// Read the reviewers from the content file so editing the reviews never breaks these tests.
const names = testimonials.map((t) => t.name);

test.describe("Kind Words carousel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for Swiper to take over from the prerendered row.
    await expect(page.locator("#stories .swiper-initialized")).toBeVisible();
  });

  test("carries all six reviews, each with a five star rating", async ({ page }) => {
    const section = page.locator("#stories");
    for (const name of names) {
      await expect(section.getByText(name, { exact: true }).first()).toHaveCount(1);
    }

    // Loop mode duplicates slides, so count the ratings on the six real ones.
    const ratings = section.locator(".swiper-slide:not(.swiper-slide-duplicate) figure p[aria-label='Rated 5 out of 5']");
    await expect(ratings).toHaveCount(6);
    await expect(ratings.first().locator("svg")).toHaveCount(5);
  });

  test("names the place and not the city, and Goa rather than India", async ({ page }) => {
    const card = (name: string) => page.locator("#stories figure").filter({ hasText: name }).first();

    const spain = card("Lucía Fernández & Alejandro Martín");
    await expect(spain).toContainText("Spain");
    await expect(spain).not.toContainText("Barcelona");

    const goa = card("Natasha D’Souza & Ryan Fernandes");
    await expect(goa).toContainText("Goa");
    await expect(goa).not.toContainText("India");
  });

  test("steps forward three at a time and loops back round", async ({ page, isMobile }) => {
    test.skip(isMobile, "Three at a time is the desktop layout.");
    const section = page.locator("#stories");
    const visible = section.locator(".swiper-slide-visible");
    await expect(visible).toHaveCount(3);
    await expect(visible.first()).toContainText(names[0]);

    await section.getByRole("button", { name: "Next reviews" }).click();
    await expect(visible.first()).toContainText(names[3]);
    await expect(visible).toHaveCount(3);

    // Six reviews, three at a time: the next step comes back to the first.
    await section.getByRole("button", { name: "Next reviews" }).click();
    await expect(visible.first()).toContainText(names[0]);

    await section.getByRole("button", { name: "Previous reviews" }).click();
    await expect(visible.first()).toContainText(names[3]);
  });

  test("shows one card at a time on a phone", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Single card is the phone layout.");
    await expect(page.locator("#stories .swiper-slide-visible")).toHaveCount(1);
  });
});
