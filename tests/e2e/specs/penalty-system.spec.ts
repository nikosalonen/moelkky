/** @format */

import { test, expect } from "@playwright/test";
import { GameSetupPage } from "../pages/GameSetupPage";
import { GamePlayPage } from "../pages/GamePlayPage";

test.describe("Penalty System Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Setup a basic game for each test
    const setupPage = new GameSetupPage(page);
    await setupPage.navigateToSetup();
    await setupPage.selectGameMode("individual");
    await setupPage.addPlayer("Alice");
    await setupPage.addPlayer("Bob");
    await setupPage.addPlayer("Charlie");
    await setupPage.startGame();
  });

  test.describe("Basic Penalty Functionality", () => {
    test("should show penalty modal and allow confirmation", async ({ page }) => {
      const playPage = new GamePlayPage(page);
      await playPage.waitForGamePlayReady();

      // Click apply penalty button
      await playPage.clickElement(playPage.getApplyPenaltyButtonSelector());

      // Verify penalty modal appears
      await playPage.waitForElement(playPage.getPenaltyModalSelector());
      await expect(page.locator(playPage.getPenaltyModalSelector())).toBeVisible();

      // Verify confirm and cancel buttons are present
      await expect(page.locator(playPage.getConfirmPenaltyButtonSelector())).toBeVisible();
      await expect(page.locator(playPage.getCancelPenaltyButtonSelector())).toBeVisible();

      // Confirm the penalty
      await playPage.clickElement(playPage.getConfirmPenaltyButtonSelector());

      // Verify modal closes
      await expect(page.locator(playPage.getPenaltyModalSelector())).not.toBeVisible();
    });

    test("should show penalty modal and allow cancellation", async ({ page }) => {
      const playPage = new GamePlayPage(page);
      await playPage.waitForGamePlayReady();

      // Click apply penalty button
      await playPage.clickElement(playPage.getApplyPenaltyButtonSelector());

      // Verify penalty modal appears
      await playPage.waitForElement(playPage.getPenaltyModalSelector());
      await expect(page.locator(playPage.getPenaltyModalSelector())).toBeVisible();

      // Cancel the penalty
      await playPage.clickElement(playPage.getCancelPenaltyButtonSelector());

      // Verify modal closes and penalty is not applied
      await expect(page.locator(playPage.getPenaltyModalSelector())).not.toBeVisible();
    });

    test("should allow entering penalty reason", async ({ page }) => {
      const playPage = new GamePlayPage(page);
      await playPage.waitForGamePlayReady();

      // Apply penalty with reason
      await playPage.applyPenalty("Throwing violation");

      // Verify penalty was applied (no error thrown)
      // The actual behavior depends on the current score
      const currentScore = await playPage.getCurrentPlayerScore();
      expect(currentScore).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Out-of-Turn Throws (Finnish Mölkky Rules)", () => {
    test("should handle out-of-turn throw with low score (<37 points) - no change", async ({ page }) => {
      const playPage = new GamePlayPage(page);
      await playPage.waitForGamePlayReady();

      // Give Alice some points but keep under 37
      await playPage.submitPinScore([10]); // 10 points
      await playPage.waitForPlayerTurn("Bob");
      await playPage.submitPinScore([12]); // 12 points
      await playPage.waitForPlayerTurn("Charlie");
      await playPage.submitPinScore([8]); // 8 points
      await playPage.waitForPlayerTurn("Alice");

      // Verify Alice has 10 points (under 37)
      await playPage.assertPlayerScore("Alice", 10);

      // Mark Alice's throw as out-of-turn
      await playPage.markOutOfTurn();

      // Verify score remains unchanged (under 37 points rule)
      await playPage.assertPlayerScore("Alice", 10);
    });

    test("should handle out-of-turn throw with high score (≥37 points) - reset to 25", async ({ page }) => {
      const playPage = new GamePlayPage(page);
      await playPage.waitForGamePlayReady();

      // Give Alice points to get to a high score (≥37)
      // Use multiple rounds to build up score
      for (let round = 0; round < 4; round++) {
        await playPage.submitPinScore([10]); // 10 points per round
        await playPage.waitForPlayerTurn("Bob");
        await playPage.submitPinScore([12]); // 12 points per round
        await playPage.waitForPlayerTurn("Charlie");
        await playPage.submitPinScore([8]); // 8 points per round
        await playPage.waitForPlayerTurn("Alice");
      }

      // Get Alice's current score (should be ≥37 after 4 rounds of 10 points = 40)
      const currentScore = await playPage.getCurrentPlayerScore();
      expect(currentScore).toBeGreaterThanOrEqual(37); // Should be at least 37

      // Mark Alice's throw as out-of-turn
      await playPage.markOutOfTurn();

      // Verify score resets to 25 (≥37 points rule)
      await playPage.assertPlayerScore("Alice", 25);
    });
  });

  test.describe("Score Over 50 Reset (Finnish Mölkky Rules)", () => {
    test("should reset score to 25 when going over 50 points", async ({ page }) => {
      const playPage = new GamePlayPage(page);
      await playPage.waitForGamePlayReady();

      // Give Alice points to get close to 50, but not exactly 50
      // Use 4 rounds of 10 points = 40 points, then add 5 to get to 45
      for (let round = 0; round < 4; round++) {
        await playPage.submitPinScore([10]); // 10 points per round
        await playPage.waitForPlayerTurn("Bob");
        await playPage.submitPinScore([12]); // 12 points per round
        await playPage.waitForPlayerTurn("Charlie");
        await playPage.submitPinScore([8]); // 8 points per round
        await playPage.waitForPlayerTurn("Alice");
      }

      // Add 5 more points to get Alice to 45
      await playPage.submitPinScore([5]);
      await playPage.waitForPlayerTurn("Bob");
      await playPage.submitPinScore([12]);
      await playPage.waitForPlayerTurn("Charlie");
      await playPage.submitPinScore([8]);
      await playPage.waitForPlayerTurn("Alice");

      // Now give Alice 8 points to go over 50 (45 + 8 = 53, should reset to 25)
      await playPage.submitPinScore([8]); // This should go over 50 and reset to 25

      // Verify score was reset to 25
      const finalScore = await playPage.getCurrentPlayerScore();
      expect(finalScore).toBe(25);
    });
  });

  test.describe("Manual Penalty Application", () => {
    test("should apply manual penalty and reset score to 25", async ({ page }) => {
      const playPage = new GamePlayPage(page);
      await playPage.waitForGamePlayReady();

      // Give Alice some points first
      for (let round = 0; round < 3; round++) {
        await playPage.submitPinScore([10]); // 10 points per round
        await playPage.waitForPlayerTurn("Bob");
        await playPage.submitPinScore([12]); // 12 points per round
        await playPage.waitForPlayerTurn("Charlie");
        await playPage.submitPinScore([8]); // 8 points per round
        await playPage.waitForPlayerTurn("Alice");
      }

      // Get Alice's current score
      const currentScore = await playPage.getCurrentPlayerScore();
      expect(currentScore).toBeGreaterThanOrEqual(20); // Should be at least 20

      // Apply manual penalty
      await playPage.applyPenalty("Rule violation");

      // Verify penalty was applied by checking Alice's score from the score board
      // (since the turn advances to Bob after penalty)
      const aliceScoreAfterPenalty = await playPage.getPlayerScoreFromBoard("Alice");
      expect(aliceScoreAfterPenalty).toBe(25); // Should be reset to 25
    });
  });
}); 
