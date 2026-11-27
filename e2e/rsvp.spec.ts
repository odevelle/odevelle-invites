import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/*
 * Guest RSVPs through the real form and Server Action. The test server uses
 * fixtures, so replies are accepted but not stored (storage, limits, meals,
 * de-duplication and rate limits are proven against Postgres in tests/db).
 */

// Reduced motion: the Royal Luxury intro opens at once and scroll reveals are skipped.
test.use({ reducedMotion: "reduce" });

async function openInvitation(page: Page, url: string) {
  await page.goto(url);
  // Wait for the invitation to stream in before deciding whether it opens with an intro.
  await page.locator("[data-invitation]").waitFor();
  if (await page.locator(".rl2-intro").count()) {
    await page.locator(".rl2-intro__tap").click();
    await expect(page.locator(".rl2-intro")).toHaveCount(0, { timeout: 5_000 });
  }
  const rsvp = page.locator('[data-section="rsvp"]');
  await rsvp.scrollIntoViewIfNeeded();
  return rsvp;
}

test("accepting: a 1–50 guest dropdown and the meal question appear", async ({ page }) => {
  const rsvp = await openInvitation(page, "/sites/chloe-shane"); // meals asked

  await rsvp.getByLabel("Your name").fill("Ana Silva");
  await expect(rsvp.getByLabel("Number of guests")).toHaveCount(0);
  await expect(rsvp.getByText("Meal preference")).toHaveCount(0);

  await rsvp.getByText("Joyfully accept").click();
  const count = rsvp.getByLabel("Number of guests");
  await expect(count).toHaveValue("1"); // includes the person replying
  const options = await count.locator("option").allTextContents();
  expect(options).toEqual(Array.from({ length: 50 }, (_, i) => String(i + 1)));
  await count.selectOption("3");

  await rsvp.getByText("Vegetarian", { exact: true }).click();
  await rsvp.getByLabel(/A message for/).fill("Can’t wait!");
  await rsvp.getByRole("button", { name: "Send RSVP" }).click();

  const sent = rsvp.getByRole("status");
  await expect(sent).toContainText("Thank you, Ana");
  await expect(sent).toContainText("We look forward to celebrating with you");
  await expect(sent).toBeFocused();

  await rsvp.getByRole("button", { name: "Reply for someone else" }).click();
  await expect(rsvp.getByLabel("Your name")).toHaveValue("");
});

test("declining: no guest count or meal, a kind confirmation", async ({ page }) => {
  const rsvp = await openInvitation(page, "/sites/leela-arjun");
  await rsvp.getByLabel("Your name").fill("Rui Costa");
  await rsvp.getByText("Joyfully accept").click();
  await expect(rsvp.getByText("Vegan", { exact: true })).toBeVisible();
  await rsvp.getByText("Regretfully decline").click();
  await expect(rsvp.getByLabel("Number of guests")).toHaveCount(0);
  await expect(rsvp.getByText("Vegan", { exact: true })).toHaveCount(0);
  await rsvp.getByRole("button", { name: "Send RSVP" }).click();
  await expect(rsvp.getByRole("status")).toContainText("You’ll be missed");
});

test("without meal options the form doesn't ask about meals", async ({ page }) => {
  const rsvp = await openInvitation(page, "/sites/maya-turns-30");
  await rsvp.getByText("Joyfully accept").click();
  await expect(rsvp.getByLabel("Number of guests")).toBeVisible();
  await expect(rsvp.getByText("Meal preference")).toHaveCount(0);
  await expect(rsvp.getByLabel("Email")).toHaveCount(0); // no contact details are collected
});

test("server-side validation: errors per field, focus moves to the first, typing is kept", async ({ page }) => {
  const rsvp = await openInvitation(page, "/sites/maya-turns-30");
  const form = rsvp.locator("form");
  // Skip the browser's own checks to prove the server's.
  await form.evaluate((f: HTMLFormElement) => (f.noValidate = true));
  await rsvp.getByLabel(/A message for/).fill("See you there!");
  await rsvp.getByRole("button", { name: "Send RSVP" }).click();

  await expect(rsvp.getByText("Please enter your full name")).toBeVisible();
  await expect(rsvp.getByText("Please let us know if you can come")).toBeVisible();
  await expect(rsvp.getByLabel("Your name")).toBeFocused();
  await expect(rsvp.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  await expect(rsvp.getByLabel(/A message for/)).toHaveValue("See you there!");
});

test("the server refuses more than 50 guests, even if the page is tampered with", async ({ page }) => {
  const rsvp = await openInvitation(page, "/sites/chloe-shane");
  await rsvp.getByLabel("Your name").fill("Sneaky Guest");
  await rsvp.getByText("Joyfully accept").click();
  const form = rsvp.locator("form");
  await form.evaluate((f: HTMLFormElement) => {
    f.noValidate = true;
    const select = f.querySelector<HTMLSelectElement>("select[name=partySize]");
    if (select) select.add(new Option("51", "51", true, true));
  });
  await rsvp.getByRole("button", { name: "Send RSVP" }).click();
  await expect(rsvp.getByText("Up to 50 guests per reply")).toBeVisible();
});

test("works on a couple's own subdomain (the Server Action passes the proxy and Origin checks)", async ({ page }) => {
  const base = new URL(test.info().project.use.baseURL ?? "");
  test.skip(base.hostname !== "localhost", "needs the local test server");
  base.hostname = "chloe-shane.localhost";
  const rsvp = await openInvitation(page, base.toString());

  await rsvp.getByLabel("Your name").fill("Inês");
  await rsvp.getByText("Regretfully decline").click();
  await rsvp.getByRole("button", { name: "Send RSVP" }).click();
  await expect(rsvp.getByRole("status")).toContainText("Thank you, Inês");
});

test("after the last event has started, the form says replies have closed", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2031-01-01T00:00:00Z"));
  const rsvp = await openInvitation(page, "/sites/maya-turns-30");
  await expect(rsvp.locator('[data-rsvp-state="closed"]')).toContainText("Replies have now closed");
  await expect(rsvp.locator("form")).toHaveCount(0);
});
