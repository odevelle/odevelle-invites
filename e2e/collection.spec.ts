import { expect, test } from "./fixtures";

const designs = ["Royal Lace", "Azulejo", "Embroidered Garden", "Pearl Shore"];

test.describe("Collection and design preview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("lists the four designs", async ({ page }) => {
    const cards = page.locator("#collection [role=listitem]");
    await expect(cards).toHaveCount(4);
    for (const [i, title] of designs.entries()) {
      await expect(cards.nth(i).getByRole("heading", { level: 3 })).toHaveText(title);
    }
  });

  test("opens the preview, cycles designs and closes", async ({ page }) => {
    await page.getByRole("button", { name: "Preview the Royal Lace invitation" }).last().click();
    const dialog = page.getByRole("dialog", { name: "Invitation preview" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Royal Lace");
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
});
