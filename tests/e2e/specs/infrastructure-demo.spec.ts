/** @format */

import { test, expect } from "../fixtures";
import { createGameHelpers } from "../utils";
import { BasePage } from "../pages/BasePage";

/**
 * Demo test showcasing the base testing infrastructure
 * This test demonstrates the usage of BasePage, fixtures, and test helpers
 */
test.describe("Infrastructure Demo", () => {
  test("should demonstrate BasePage functionality", async ({ page }) => {
    const basePage = new BasePage(page);

    // Navigate to application
    await basePage.goto("/");

    // Verify page loaded correctly
    await basePage.assertElementVisible('[role="main"]');
    await basePage.assertElementText("h1", "Mölkky Score Counter");

    // Take screenshot for verification
    await basePage.takeScreenshot("infrastructure-demo-loaded");

    // Check page title
    const title = await basePage.getPageTitle();
    expect(title).toMatch(/Mölkky/i);
  });

  test("should demonstrate game fixtures and helpers", async ({
    page,
    gameData,
    gameSetup,
  }) => {
    const helpers = createGameHelpers(page);

    // Generate test data using fixtures
    const scenario = gameData.basicIndividualGame(2);
    expect(scenario.players).toHaveLength(2);
    expect(scenario.gameMode).toBe("individual");

    // Setup fresh game environment
    await gameSetup.setupFreshGame();

    // Verify initial game state
    await helpers.assertions.gameState("setup");

    // Test data generation utilities
    const randomNames = helpers.dataGeneration.randomPlayerNames(3);
    expect(randomNames).toHaveLength(3);

    const randomScore = helpers.dataGeneration.randomScore(1, 49);
    expect(randomScore).toBeGreaterThanOrEqual(1);
    expect(randomScore).toBeLessThanOrEqual(49);
  });

  test("should demonstrate complex game scenario", async ({
    page,
    gameData,
    gameSetup,
  }) => {
    const helpers = createGameHelpers(page);

    // Create a game with predetermined winner
    const scenario = gameData.gameWithWinner("Alice");

    // Setup the game scenario
    await gameSetup.setupFreshGame();

    // Verify we're in setup state
    await helpers.assertions.gameState("setup");

    // Take screenshot of game setup
    await helpers.ui.screenshotWithContext("game-setup", "initial-state");
  });

  test("should demonstrate error handling and edge cases", async ({
    page,
    gameData,
  }) => {
    const helpers = createGameHelpers(page);

    // Navigate to app
    await page.goto("/");

    // Test edge case scenarios
    const edgeCase = gameData.edgeCaseScenarios.minimumPlayers();
    expect(edgeCase.players).toHaveLength(2);

    // Test UI stability
    await helpers.ui.waitForStableUI();

    // Check for console errors
    await helpers.assertions.noConsoleErrors();

    // Test accessibility
    await helpers.assertions.accessibility();
  });

  test("should demonstrate performance measurement", async ({ page }) => {
    const helpers = createGameHelpers(page);

    // Measure page load performance
    const loadTime = await helpers.performance.measurePageLoad();
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds

    // Measure action performance
    const { result, duration } = await helpers.performance.measureAction(
      async () => {
        // Click the game history button that actually exists
        await page.click('button:has-text("View Game History")');
        return "clicked";
      }
    );

    expect(result).toBe("clicked");
    expect(duration).toBeLessThan(5000); // Action should complete within 5 seconds
  });

  test("should demonstrate debug utilities", async ({ page }) => {
    const helpers = createGameHelpers(page);

    // Navigate to app
    await page.goto("/");

    // Log current page state (useful for debugging)
    await helpers.debug.logPageState();

    // Get all visible text (useful for content verification)
    const visibleText = await helpers.ui.getAllVisibleText();
    expect(visibleText).toContain("Mölkky Score Counter");
  });
});
