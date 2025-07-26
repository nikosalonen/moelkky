/** @format */

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("should load the application successfully", async ({ page }) => {
    // Navigate to the application
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Mölkky/i);

    // Verify the main content is visible
    const appRoot = page.locator("#app");
    await expect(appRoot).toBeVisible();

    // Verify the main game content is visible
    const mainContent = page.locator('[role="main"]');
    await expect(mainContent).toBeVisible();

    // Take a screenshot for visual verification
    await page.screenshot({ path: "test-results/smoke-test.png" });
  });

  test("should have no console errors on load", async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the application
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that there are no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
