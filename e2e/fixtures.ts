import { test as base, expect } from "@playwright/test";

/**
 * Shared test fixture: every test fails if the page logs a console error or
 * throws an uncaught exception, so runtime regressions surface automatically.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(err.message));
      await use(errors);
      expect(errors, "console errors / uncaught exceptions").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
