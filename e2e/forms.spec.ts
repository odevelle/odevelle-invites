import { expect, test } from "./fixtures";

// The forms are not connected to a backend yet; these tests cover the UI flow only.
// Extend them to assert the request once the server actions exist.

test.describe("Enquiry form", () => {
  test("shows the chosen design and the confirmation", async ({ page }) => {
    await page.goto("/#begin");
    const form = page.locator("#begin form");

    await form.getByLabel("Your names").fill("Charlotte and Henry");
    await form.getByLabel("Email").fill("charlotte@example.com");
    await form.getByLabel("WhatsApp number").fill("+44 7700 900000");
    await form.getByLabel("The design you love").selectOption("shore");
    await expect(form).toContainText("You have chosen Pearl Shore.");
    await form.getByLabel("Your celebration").fill("120 guests, beach ceremony in Amalfi.");

    await form.getByRole("button", { name: "Send to the studio" }).click();
    await expect(page.locator("#begin").getByRole("status")).toContainText("Thank you. Your story is in good hands.");
  });
});

test.describe("Subscribe form", () => {
  test("confirms the signup", async ({ page }) => {
    await page.goto("/#subscribe");
    await page.getByLabel("Email address").fill("guest@example.com");
    await page.getByRole("button", { name: "Join the list" }).click();
    await expect(page.locator("#subscribe").getByRole("status")).toContainText("You are on the list.");
  });
});
