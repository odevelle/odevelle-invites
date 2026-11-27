import { expect, test } from "./fixtures";

/*
 * The couple dashboard's front door. These tests never send a sign-in email:
 * they cover what happens without a session (the database-level guarantees,
 * RLS on every read, are proven in tests/db/dashboard.spec.ts).
 */

test("the header's Couple Dashboard link leads a signed-out visitor to sign in", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Couple Dashboard" }).click();
  } else {
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Couple Dashboard" }).click();
  }
  await expect(page).toHaveURL(/\/login(\?next=%2Fdashboard)?$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("dashboard pages and exports need a session", async ({ page, request }) => {
  await page.goto("/dashboard/chloe-shane");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fchloe-shane$/);

  const exported = await request.get("/dashboard/chloe-shane/export", { maxRedirects: 0 });
  expect(exported.status()).toBe(303);
  expect(exported.headers()["location"]).toContain("/login?next=%2Fdashboard%2Fchloe-shane");
  expect(exported.headers()["content-type"] ?? "").not.toContain("text/csv");
});

test("account pages are private: no caching, no indexing", async ({ request }) => {
  const response = await request.get("/login");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(await response.text()).toContain('name="robots" content="noindex, nofollow');
});

test("login: email first, with an accessible label and the browser's own checks", async ({ page }) => {
  await page.goto("/login");
  const email = page.getByLabel("Email address");
  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("autocomplete", "email");
  await expect(page.getByLabel(/password/i)).toHaveCount(0);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  // Empty: the browser stops it before anything is sent.
  await expect(page.getByRole("button", { name: "Email me a sign-in code" })).toBeVisible();
  expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
});

test("login: an expired or reused email link explains itself", async ({ page }) => {
  await page.goto("/login?error=link");
  await expect(page.getByText("That sign-in link has expired or has already been used")).toBeVisible();
});

test("the email link asks for a click before using its one-time token", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=abc123&type=email&next=%2Fdashboard");
  await expect(page.getByRole("button", { name: "Continue to my dashboard" })).toBeVisible();
  await expect(page.locator('input[name="token_hash"]')).toHaveValue("abc123");

  await page.goto("/auth/confirm?next=https%3A%2F%2Fevil.example");
  await expect(page).toHaveURL(/\/login\?error=link$/);
});

test("account pages don't exist on an invitation's subdomain", async ({ page, consoleErrors }) => {
  const base = new URL(test.info().project.use.baseURL ?? "");
  test.skip(base.hostname !== "localhost", "needs the local test server");
  base.hostname = "chloe-shane.localhost";
  for (const path of ["/dashboard", "/login", "/auth/confirm"]) {
    base.pathname = path;
    const response = await page.goto(base.toString());
    expect(response?.status(), path).toBe(404);
  }
  // The browser logs each document's own 404 as a console error; those are expected here.
  consoleErrors.splice(0, consoleErrors.length, ...consoleErrors.filter((e) => !/status of 404/.test(e)));
});
