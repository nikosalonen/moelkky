/** @format */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Game Play functionality
 * Handles scoring, penalties, turn management, and game state validation
 */
export class GamePlayPage extends BasePage {
  // Current Turn Display Selectors
  private readonly currentTurnDisplay =
    '.mobile-text-base:has-text("Turn"):not(:has-text("Current Turn"))';
  private readonly currentPlayerName =
    '.font-semibold.text-blue-700:has-text("Turn")';
  private readonly currentPlayerScore = 'p:has-text("Current Score:")';

  // Score Input Selectors
  private readonly scoreInputSection =
    '[data-testid="score-input"], .bg-white:has-text("Score Entry")';
  private readonly pinButton = (pin: number) =>
    `button[aria-pressed]:has-text("${pin}")`;
  private readonly missButton = 'button:has-text("Miss")';
  private readonly submitScoreButton = 'button:has-text("Submit Score")';
  private readonly calculatedScore = '.font-bold:has-text("Calculated Score:")';

  // Penalty Selectors
  private readonly applyPenaltyButton = 'button:has-text("Apply Penalty")';
  private readonly confirmPenaltyButton =
    'button:has-text("Apply"):not(:has-text("Penalty"))';
  private readonly cancelPenaltyButton = 'button:has-text("Cancel")';
  private readonly penaltyModal = '.fixed:has-text("Confirm Penalty")';

  // Out of Turn Selectors
  private readonly outOfTurnButton = 'button:has-text("Out-of-Turn")';

  // Score Board Selectors
  private readonly scoreBoardToggle = 'summary:has-text("Score Board")';
  private readonly scoreBoardContent =
    'details:has(summary:has-text("Score Board"))';
  private readonly playerScoreItem = (playerName: string) =>
    `.flex:has-text("${playerName}")`;
  private readonly teamScoreItem = (teamName: string) =>
    `.border:has-text("${teamName}")`;

  // Game State Selectors
  private readonly gameFinishedIndicator =
    '.text-center:has-text("Game Finished")';
  private readonly winnerDisplay =
    '.text-center:has-text("Winner"), .text-green-600:has-text("Winner")';
  private readonly noWinnerDisplay =
    '.text-center:has-text("No Winner"), .text-gray-600:has-text("No Winner")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for the game play interface to be ready
   */
  async waitForGamePlayReady(): Promise<void> {
    await this.waitForElement(this.scoreInputSection);
    await this.waitForElement(this.currentTurnDisplay);
    await this.page.waitForTimeout(500); // Allow animations to complete
  }

  /**
   * Get the name of the current player
   */
  async getCurrentPlayerName(): Promise<string> {
    await this.waitForElement(this.currentPlayerName);
    const text = await this.getElementText(this.currentPlayerName);

    // Extract player name from text like "Alice's Turn"
    const match = text.match(/(.+?)'s Turn/);
    return match ? match[1].trim() : text.trim();
  }

  /**
   * Get the current player's score
   */
  async getCurrentPlayerScore(): Promise<number> {
    await this.waitForElement(this.currentPlayerScore);
    const text = await this.getElementText(this.currentPlayerScore);

    // Extract score from text like "Current Score: 25 / 50"
    const match = text.match(/Current Score:\s*(\d+)\s*\/\s*50/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Select pins by clicking pin buttons
   */
  async selectPins(pins: number[]): Promise<void> {
    // Clear any existing selections first
    await this.clearPinSelection();

    for (const pin of pins) {
      if (pin >= 1 && pin <= 12) {
        // Use first() to handle multiple matches
        const pinElement = this.page.locator(this.pinButton(pin)).first();
        await pinElement.click();
        await this.page.waitForTimeout(100); // Small delay between selections
      }
    }
  }

  /**
   * Clear all pin selections
   */
  async clearPinSelection(): Promise<void> {
    // Click on selected pins to deselect them
    const selectedPins = await this.getAllElements(
      'button[aria-pressed="true"]'
    );
    for (const pin of selectedPins) {
      await pin.click();
      await this.page.waitForTimeout(50);
    }
  }

  /**
   * Submit a miss (0 points)
   */
  async submitMiss(): Promise<void> {
    await this.clickElement(this.missButton);

    // Wait for submission to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the calculated score display
   */
  async getCalculatedScore(): Promise<number> {
    await this.waitForElement(this.calculatedScore);
    const text = await this.getElementText(this.calculatedScore);

    // Extract score from text like "Calculated Score: 5"
    const match = text.match(/Calculated Score:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Submit the current score
   */
  async submitScore(): Promise<void> {
    await this.waitForElement(this.submitScoreButton);
    await this.assertElementEnabled(this.submitScoreButton);
    await this.clickElement(this.submitScoreButton);

    // Wait for score submission to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Submit score by selecting pins
   */
  async submitPinScore(pins: number[]): Promise<void> {
    await this.selectPins(pins);
    await this.submitScore();
  }

  /**
   * Apply a penalty to the current player
   */
  async applyPenalty(reason?: string): Promise<void> {
    await this.clickElement(this.applyPenaltyButton);

    // Wait for penalty modal to appear
    await this.waitForElement(this.penaltyModal);

    if (reason) {
      // If there's a reason input field, fill it
      const reasonInput = this.page.locator('input[placeholder*="reason" i]');
      if (await reasonInput.isVisible()) {
        await reasonInput.fill(reason);
      }
    }

    await this.clickElement(this.confirmPenaltyButton);

    // Wait for penalty to be applied
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel penalty application
   */
  async cancelPenalty(): Promise<void> {
    await this.clickElement(this.applyPenaltyButton);

    // Wait for penalty modal to appear
    await this.waitForElement(this.penaltyModal);

    await this.clickElement(this.cancelPenaltyButton);

    // Wait for modal to close
    await this.page.waitForTimeout(300);
  }

  /**
   * Mark current player's throw as out-of-turn
   */
  async markOutOfTurn(): Promise<void> {
    await this.clickElement(this.outOfTurnButton);

    // Wait for action to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Open the score board
   */
  async openScoreBoard(): Promise<void> {
    await this.clickElement(this.scoreBoardToggle);

    // Wait for score board to expand and content to be visible
    await this.page.waitForTimeout(500);

    // Wait for the score board content to be visible
    try {
      await this.page
        .locator(this.scoreBoardContent)
        .waitFor({ state: "visible", timeout: 2000 });
    } catch (error) {
      console.warn("Score board content not visible, continuing anyway...");
    }
  }

  /**
   * Close the score board
   */
  async closeScoreBoard(): Promise<void> {
    // Click again to close if it's open
    const isOpen = await this.page
      .locator(this.scoreBoardContent)
      .getAttribute("open");
    if (isOpen) {
      await this.clickElement(this.scoreBoardToggle);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get a player's score from the score board
   */
  async getPlayerScoreFromBoard(playerName: string): Promise<number> {
    await this.openScoreBoard();

    // Use a more specific selector that looks for the player name in the score board
    // and extracts the score from the same element
    const playerElement = this.page
      .locator(`.flex:has-text("${playerName}"):has-text("/ 50")`)
      .first();

    try {
      await playerElement.waitFor({ state: "visible", timeout: 5000 });
      const text = await playerElement.textContent();
      if (!text) return 0;

      // Extract score from text like "Alice 25 / 50" or "AliceCurrent Turn 10 / 50"
      // Look for the pattern: playerName (possibly followed by "Current Turn") followed by a number, then "/ 50"
      const playerScorePattern = new RegExp(
        `${playerName}(?:Current Turn)?\\s*(\\d+)\\s*\\/\\s*50`
      );
      const match = text.match(playerScorePattern);
      return match ? parseInt(match[1], 10) : 0;
    } catch (error) {
      console.warn(
        `Could not find score for player ${playerName} on scoreboard:`,
        error
      );
      return 0; // Return 0 or throw an error if score is not found
    }
  }

  /**
   * Get a team's score from the score board
   */
  async getTeamScoreFromBoard(teamName: string): Promise<number> {
    await this.openScoreBoard();

    const teamElement = this.page.locator(this.teamScoreItem(teamName));
    await this.waitForElement(this.teamScoreItem(teamName));

    const text = await teamElement.textContent();
    if (!text) return 0;

    // Extract score from text like "Team Alpha 45"
    const match = text.match(/\b(\d+)\b/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get all player scores from the score board
   */
  async getAllPlayerScores(): Promise<
    Array<{ name: string; score: number; isActive: boolean }>
  > {
    const scores: Array<{ name: string; score: number; isActive: boolean }> =
      [];

    try {
      // Open score board and wait for it to be visible
      await this.openScoreBoard();

      // Check if this is team mode by looking for team names in the page
      const pageText = await this.page.textContent("body");
      const isTeamMode =
        pageText?.includes("Team Alpha") ||
        pageText?.includes("Team Beta") ||
        pageText?.includes("Team Gamma") ||
        false;

      if (isTeamMode) {
        // For team mode, get scores directly from individual player elements
        const expectedPlayers = [
          "Player A1",
          "Player A2",
          "Player B1",
          "Player B2",
          "Player C1",
          "Player C2",
        ];

        for (const playerName of expectedPlayers) {
          try {
            // Look for the player element in the score board
            const playerElement = this.page
              .locator(`.flex:has-text("${playerName}")`)
              .first();
            await playerElement.waitFor({ state: "visible", timeout: 2000 });

            const playerText = await playerElement.textContent();
            console.log(
              `Player element text for ${playerName}: "${playerText}"`
            );

            // Extract score from the player element
            const scoreMatch = playerText?.match(/(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

            // Check if this player is currently active
            const isActive = (await this.getCurrentPlayerName()) === playerName;

            console.log(
              `Found team player: "${playerName}", score: ${score}, active: ${isActive}`
            );

            scores.push({
              name: playerName,
              score,
              isActive,
            });
          } catch (error) {
            console.warn(`Could not get score for ${playerName}:`, error);
            // Add player with 0 score if we can't get their score
            scores.push({
              name: playerName,
              score: 0,
              isActive: false,
            });
          }
        }
      } else {
        // Individual mode - use existing logic
        const scoreBoardText = await this.getElementText(
          this.scoreBoardContent
        );
        console.log(`Score board text: "${scoreBoardText}"`);

        const playerMatches = scoreBoardText.match(
          /(Player \d+)(?:Current Turn)?\s*(\d+)\s*\/\s*50/g
        );

        if (playerMatches) {
          for (const match of playerMatches) {
            const playerMatch = match.match(
              /(Player \d+)(?:Current Turn)?\s*(\d+)\s*\/\s*50/
            );
            if (playerMatch) {
              const playerName = playerMatch[1].trim();
              const score = parseInt(playerMatch[2], 10);
              const isActive = match.includes("Current Turn");

              console.log(
                `Found individual player: "${playerName}", score: ${score}, active: ${isActive}`
              );

              scores.push({
                name: playerName,
                score,
                isActive,
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn("Error getting scores:", error);
    }

    console.log(`Final scores array: ${JSON.stringify(scores)}`);
    return scores;
  }

  /**
   * Check if the game is finished
   */
  async isGameFinished(): Promise<boolean> {
    try {
      // Look for winner display which indicates game is finished
      // The WinnerDisplay component shows "{winner.name} Wins!" in an h2 element
      await this.waitForElement('h2:has-text("Wins!")', { timeout: 1000 });
      return true;
    } catch {
      // Also check for the winner display container
      try {
        await this.waitForElement(
          '.bg-white.rounded-lg.shadow-lg:has(h2:has-text("Wins!"))',
          { timeout: 500 }
        );
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Check if there's a winner
   */
  async hasWinner(): Promise<boolean> {
    try {
      await this.waitForElement(this.winnerDisplay, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the winner's name
   */
  async getWinnerName(): Promise<string | null> {
    try {
      await this.waitForElement(this.winnerDisplay);
      const text = await this.getElementText(this.winnerDisplay);

      // Extract winner name from text like "Winner: Alice"
      const match = text.match(/Winner:\s*(.+)/);
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if there's no winner
   */
  async hasNoWinner(): Promise<boolean> {
    try {
      await this.waitForElement(this.noWinnerDisplay, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that the current turn belongs to the expected player
   */
  async validateCurrentTurn(expectedPlayerName: string): Promise<boolean> {
    const currentPlayer = await this.getCurrentPlayerName();
    return currentPlayer === expectedPlayerName;
  }

  /**
   * Validate pin score calculation
   */
  async validatePinScoreCalculation(
    pins: number[]
  ): Promise<{ isValid: boolean; expectedScore: number; actualScore: number }> {
    await this.selectPins(pins);
    const actualScore = await this.getCalculatedScore();

    // Calculate expected score based on pin selection
    let expectedScore: number;
    if (pins.length === 1) {
      expectedScore = pins[0]; // Single pin: score = pin number
    } else if (pins.length > 1) {
      expectedScore = pins.length; // Multiple pins: score = number of pins
    } else {
      expectedScore = 0; // No pins = miss
    }

    return {
      isValid: actualScore === expectedScore,
      expectedScore,
      actualScore,
    };
  }

  /**
   * Validate game state after score submission
   */
  async validateGameStateAfterScore(
    expectedPlayerScore: number,
    expectedNextPlayer?: string
  ): Promise<{
    scoreValid: boolean;
    turnValid: boolean;
    actualScore: number;
    actualNextPlayer: string;
  }> {
    // Wait for score to be processed
    await this.page.waitForTimeout(1000);

    const actualScore = await this.getCurrentPlayerScore();
    const actualNextPlayer = await this.getCurrentPlayerName();

    return {
      scoreValid: actualScore === expectedPlayerScore,
      turnValid: expectedNextPlayer
        ? actualNextPlayer === expectedNextPlayer
        : true,
      actualScore,
      actualNextPlayer,
    };
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    const submitButton = this.page.locator(this.submitScoreButton);
    return await submitButton.isEnabled();
  }

  /**
   * Check if penalty button is enabled
   */
  async isPenaltyEnabled(): Promise<boolean> {
    const penaltyButton = this.page.locator(this.applyPenaltyButton);
    return await penaltyButton.isEnabled();
  }

  /**
   * Get penalty modal selector for testing
   */
  getPenaltyModalSelector(): string {
    return this.penaltyModal;
  }

  /**
   * Get apply penalty button selector for testing
   */
  getApplyPenaltyButtonSelector(): string {
    return this.applyPenaltyButton;
  }

  /**
   * Get confirm penalty button selector for testing
   */
  getConfirmPenaltyButtonSelector(): string {
    return this.confirmPenaltyButton;
  }

  /**
   * Get cancel penalty button selector for testing
   */
  getCancelPenaltyButtonSelector(): string {
    return this.cancelPenaltyButton;
  }

  /**
   * Get the current game mode
   */
  async getCurrentGameMode(): Promise<"individual" | "team" | null> {
    try {
      // Check for team-related elements to determine game mode
      const teamElements = await this.getAllElements(
        '.border:has-text("Team")'
      );
      if (teamElements.length > 0) {
        return "team";
      }
      return "individual";
    } catch {
      return null;
    }
  }

  /**
   * Wait for a specific player's turn
   */
  async waitForPlayerTurn(
    playerName: string,
    timeout: number = 5000
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const currentPlayer = await this.getCurrentPlayerName();
      if (currentPlayer === playerName) {
        return;
      }
      await this.page.waitForTimeout(100);
    }
    throw new Error(`Timeout waiting for ${playerName}'s turn`);
  }

  /**
   * Assert that a specific player is currently active
   */
  async assertCurrentPlayer(expectedPlayerName: string): Promise<void> {
    const currentPlayer = await this.getCurrentPlayerName();
    expect(currentPlayer).toBe(expectedPlayerName);
  }

  /**
   * Assert a player's score
   */
  async assertPlayerScore(
    playerName: string,
    expectedScore: number
  ): Promise<void> {
    const actualScore = await this.getPlayerScoreFromBoard(playerName);
    expect(actualScore).toBe(expectedScore);
  }

  /**
   * Assert the calculated score
   */
  async assertCalculatedScore(expectedScore: number): Promise<void> {
    const actualScore = await this.getCalculatedScore();
    expect(actualScore).toBe(expectedScore);
  }

  /**
   * Assert submit button state
   */
  async assertSubmitEnabled(enabled: boolean = true): Promise<void> {
    const isEnabled = await this.isSubmitEnabled();
    expect(isEnabled).toBe(enabled);
  }

  /**
   * Assert that the game is finished
   */
  async assertGameFinished(): Promise<void> {
    const isFinished = await this.isGameFinished();
    expect(isFinished).toBe(true);
  }

  /**
   * Assert that there's a winner
   */
  async assertWinner(expectedWinner: string): Promise<void> {
    const hasWinner = await this.hasWinner();
    expect(hasWinner).toBe(true);

    const winnerName = await this.getWinnerName();
    expect(winnerName).toBe(expectedWinner);
  }

  /**
   * Assert that there's no winner
   */
  async assertNoWinner(): Promise<void> {
    const hasNoWinner = await this.hasNoWinner();
    expect(hasNoWinner).toBe(true);
  }

  /**
   * End the current game and return to setup
   */
  async endGame(): Promise<void> {
    // Click the End Game button (try both possible locations)
    const endGameButton = this.page.locator(
      'button:has-text("🏁 End Game"), button:has-text("End Game")'
    );
    await endGameButton.first().click();

    // Wait for the game to end and return to setup
    await this.page.waitForSelector(
      'button:has-text("Start Game"), button:has-text("Start Team Game")'
    );
  }

  /**
   * Check if end game button is visible
   */
  async isEndGameButtonVisible(): Promise<boolean> {
    try {
      // Check both possible End Game button locations (GameBoard and MobileNav)
      const endGameButton = this.page.locator(
        'button:has-text("🏁 End Game"), button:has-text("End Game")'
      );
      await endGameButton.first().waitFor({ timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Assert that end game button is visible
   */
  async assertEndGameButtonVisible(visible: boolean = true): Promise<void> {
    const isVisible = await this.isEndGameButtonVisible();
    expect(isVisible).toBe(visible);
  }

  /**
   * Wait for toast notification to appear
   */
  async waitForToastNotification(expectedText: string): Promise<void> {
    // Try different toast selectors
    const selectors = [
      `.toast:has-text("${expectedText}")`,
      `[role="alert"]:has-text("${expectedText}")`,
      `.notification:has-text("${expectedText}")`,
      `div:has-text("${expectedText}"):has-text("Game")`,
    ];

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 2000 });
        return;
      } catch {
        continue;
      }
    }

    // If none of the specific selectors work, just wait for any text containing the expected text
    await this.page.waitForSelector(`*:has-text("${expectedText}")`, {
      timeout: 5000,
    });
  }

  /**
   * Assert that a toast notification appears with specific text
   */
  async assertToastNotification(expectedText: string): Promise<void> {
    await this.waitForToastNotification(expectedText);
    const toast = this.page.locator(`*:has-text("${expectedText}")`).first();
    await expect(toast).toBeVisible();
  }

  /**
   * Open game history modal
   */
  async openGameHistory(): Promise<void> {
    await this.page.click('button:has-text("View Game History")');
    // Try different modal selectors
    const selectors = [
      '.modal:has-text("Game History")',
      '[role="dialog"]:has-text("Game History")',
      '.fixed:has-text("Game History")',
      'div:has-text("Game History"):has-text("Previous")',
    ];

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 2000 });
        return;
      } catch {
        continue;
      }
    }

    // If none work, just wait for any element with "Game History"
    await this.page.waitForSelector('*:has-text("Game History")', {
      timeout: 5000,
    });
  }

  /**
   * Close game history modal
   */
  async closeGameHistory(): Promise<void> {
    await this.page.click(
      '.modal button:has-text("Close"), .modal button:has-text("×")'
    );
    await this.page.waitForSelector('.modal:has-text("Game History")', {
      state: "hidden",
    });
  }

  /**
   * Check if game history modal is visible
   */
  async isGameHistoryVisible(): Promise<boolean> {
    try {
      const selectors = [
        '.modal:has-text("Game History")',
        '[role="dialog"]:has-text("Game History")',
        '.fixed:has-text("Game History")',
        'div:has-text("Game History"):has-text("Previous")',
      ];

      for (const selector of selectors) {
        try {
          const modal = this.page.locator(selector);
          await modal.waitFor({ timeout: 1000 });
          return true;
        } catch {
          continue;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Assert that game history modal is visible
   */
  async assertGameHistoryVisible(visible: boolean = true): Promise<void> {
    const isVisible = await this.isGameHistoryVisible();
    expect(isVisible).toBe(visible);
  }
}
