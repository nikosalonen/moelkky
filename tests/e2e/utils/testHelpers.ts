/** @format */

import { Page, Locator, expect } from "@playwright/test";
import type { TestPlayer, TestGameScenario, ScoringAction } from "../fixtures";

/**
 * Game-specific test helper utilities for Playwright tests
 */
export class GameTestHelpers {
  constructor(private page: Page) {}

  /**
   * Assertions for game state validation
   */
  assertions = {
    /**
     * Assert that the game is in the expected state
     */
    gameState: async (
      expectedState: "setup" | "playing" | "finished"
    ): Promise<void> => {
      // Use visual indicators to determine game state since we don't have data attributes yet
      if (expectedState === "setup") {
        await expect(
          this.page.locator(
            'button:has-text("Start Game"), button:has-text("Start Team Game"), button:has-text("Need")'
          )
        ).toBeVisible({ timeout: 5000 });
      } else if (expectedState === "playing") {
        await expect(
          this.page.locator('input[type="number"], input[placeholder*="score"]')
        ).toBeVisible({ timeout: 5000 });
      } else if (expectedState === "finished") {
        await expect(
          this.page.locator(
            'button:has-text("New Game"), button:has-text("Reset")'
          )
        ).toBeVisible({ timeout: 5000 });
      }
    },

    /**
     * Assert player count matches expected
     */
    playerCount: async (expectedCount: number): Promise<void> => {
      const players = this.page.locator('[data-testid^="player-"]');
      await expect(players).toHaveCount(expectedCount);
    },

    /**
     * Assert specific player exists
     */
    playerExists: async (playerName: string): Promise<void> => {
      const player = this.page.locator(`[data-testid="player-${playerName}"]`);
      await expect(player).toBeVisible();
    },

    /**
     * Assert player has expected score
     */
    playerScore: async (
      playerName: string,
      expectedScore: number
    ): Promise<void> => {
      const scoreElement = this.page.locator(
        `[data-testid="player-${playerName}-score"]`
      );
      await expect(scoreElement).toHaveText(expectedScore.toString());
    },

    /**
     * Assert current player is correct
     */
    currentPlayer: async (expectedPlayerName: string): Promise<void> => {
      const currentPlayerElement = this.page.locator(
        '[data-testid="current-player"]'
      );
      await expect(currentPlayerElement).toContainText(expectedPlayerName);
    },

    /**
     * Assert game winner
     */
    gameWinner: async (expectedWinner: string): Promise<void> => {
      const winnerElement = this.page.locator('[data-testid="game-winner"]');
      await expect(winnerElement).toContainText(expectedWinner);
    },

    /**
     * Assert team exists
     */
    teamExists: async (teamName: string): Promise<void> => {
      const team = this.page.locator(`[data-testid="team-${teamName}"]`);
      await expect(team).toBeVisible();
    },

    /**
     * Assert team has expected players
     */
    teamPlayers: async (
      teamName: string,
      expectedPlayers: string[]
    ): Promise<void> => {
      for (const playerName of expectedPlayers) {
        const teamPlayer = this.page.locator(
          `[data-testid="team-${teamName}-player-${playerName}"]`
        );
        await expect(teamPlayer).toBeVisible();
      }
    },

    /**
     * Assert button is enabled/disabled
     */
    buttonState: async (
      buttonTestId: string,
      enabled: boolean
    ): Promise<void> => {
      const button = this.page.locator(`[data-testid="${buttonTestId}"]`);
      if (enabled) {
        await expect(button).toBeEnabled();
      } else {
        await expect(button).toBeDisabled();
      }
    },

    /**
     * Assert penalty was applied
     */
    penaltyApplied: async (playerName: string): Promise<void> => {
      const penaltyIndicator = this.page.locator(
        `[data-testid="player-${playerName}-penalty"]`
      );
      await expect(penaltyIndicator).toBeVisible();
    },

    /**
     * Assert no console errors
     */
    noConsoleErrors: async (): Promise<void> => {
      const errors: string[] = [];

      this.page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      // Wait a bit to collect any errors
      await this.page.waitForTimeout(1000);

      expect(errors).toHaveLength(0);
    },

    /**
     * Assert accessibility compliance
     */
    accessibility: async (): Promise<void> => {
      // Check for basic accessibility attributes
      const buttons = this.page.locator("button");
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const hasType = await button.getAttribute("type");
        const hasAriaLabel = await button.getAttribute("aria-label");
        const hasText = await button.textContent();

        // Button should have type attribute or aria-label or text content
        expect(hasType || hasAriaLabel || hasText).toBeTruthy();
      }

      // Check for form labels
      const inputs = this.page.locator("input");
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.getAttribute("aria-label");
        const hasAriaLabelledBy = await input.getAttribute("aria-labelledby");
        const id = await input.getAttribute("id");

        if (id) {
          const label = this.page.locator(`label[for="${id}"]`);
          const labelExists = (await label.count()) > 0;
          expect(hasLabel || hasAriaLabelledBy || labelExists).toBeTruthy();
        }
      }
    },
  };

  /**
   * Data generation utilities
   */
  dataGeneration = {
    /**
     * Generate random player names
     */
    randomPlayerNames: (count: number): string[] => {
      const names = [
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
        "Eve",
        "Frank",
        "Grace",
        "Henry",
        "Ivy",
        "Jack",
        "Kate",
        "Liam",
        "Maya",
        "Noah",
        "Olivia",
        "Paul",
      ];

      const shuffled = [...names].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    },

    /**
     * Generate random scores within valid range
     */
    randomScore: (min: number = 1, max: number = 49): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Generate scoring sequence that leads to win
     */
    winningSequence: (
      playerName: string,
      currentScore: number = 0
    ): ScoringAction[] => {
      const remainingScore = 50 - currentScore;
      return [
        {
          playerName,
          score: remainingScore,
          scoringType: "single",
          expectedResult: "win",
        },
      ];
    },

    /**
     * Generate scoring sequence that causes penalty
     */
    penaltySequence: (
      playerName: string,
      currentScore: number = 0
    ): ScoringAction[] => {
      const overshotScore = 51 + Math.floor(Math.random() * 10); // Score over 50
      return [
        {
          playerName,
          score: overshotScore,
          scoringType: "single",
          expectedResult: "penalty",
        },
      ];
    },

    /**
     * Generate complex game scenario
     */
    complexGameScenario: (playerCount: number): TestGameScenario => {
      const players = this.dataGeneration
        .randomPlayerNames(playerCount)
        .map((name) => ({ name }));
      const scoringSequence: ScoringAction[] = [];

      // Generate random scoring for each player
      players.forEach((player, index) => {
        const scoreCount = Math.floor(Math.random() * 3) + 1; // 1-3 scores per player
        for (let i = 0; i < scoreCount; i++) {
          scoringSequence.push({
            playerName: player.name,
            score: this.dataGeneration.randomScore(),
            scoringType: Math.random() > 0.7 ? "multiple" : "single",
            expectedResult: "continue",
          });
        }
      });

      // Make last player win
      const winner = players[players.length - 1];
      scoringSequence.push({
        playerName: winner.name,
        score: 50,
        scoringType: "single",
        expectedResult: "win",
      });

      return {
        players,
        gameMode: "individual",
        expectedWinner: winner.name,
        scoringSequence,
      };
    },
  };

  /**
   * Game flow utilities
   */
  gameFlow = {
    /**
     * Complete game setup with players
     */
    setupGame: async (
      players: TestPlayer[],
      gameMode: "individual" | "team" = "individual"
    ): Promise<void> => {
      // Set game mode
      if (gameMode === "team") {
        await this.page.click('[data-testid="team-mode-selector"]');
      }

      // Add players
      for (const player of players) {
        await this.page.fill('[data-testid="player-name-input"]', player.name);
        await this.page.click('[data-testid="add-player-button"]');
        await this.page.waitForTimeout(100); // Small delay for UI update
      }
    },

    /**
     * Start game and verify it started
     */
    startGame: async (): Promise<void> => {
      await this.page.click('[data-testid="start-game-button"]');
      await this.assertions.gameState("playing");
    },

    /**
     * Play complete game with scoring sequence
     */
    playGame: async (scoringSequence: ScoringAction[]): Promise<void> => {
      for (const action of scoringSequence) {
        await this.gameFlow.submitScore(action.score, action.scoringType);

        if (action.expectedResult === "win") {
          await this.assertions.gameState("finished");
          break;
        } else if (action.expectedResult === "penalty") {
          await this.assertions.penaltyApplied(action.playerName);
        }

        // Wait for turn to advance
        await this.page.waitForTimeout(500);
      }
    },

    /**
     * Submit score for current player
     */
    submitScore: async (
      score: number,
      scoringType: "single" | "multiple" = "single"
    ): Promise<void> => {
      // Select scoring type if multiple
      if (scoringType === "multiple") {
        await this.page.click('[data-testid="multiple-scoring-toggle"]');
      }

      // Enter and submit score
      await this.page.fill('[data-testid="score-input"]', score.toString());
      await this.page.click('[data-testid="submit-score-button"]');
    },

    /**
     * Apply penalty to current player
     */
    applyPenalty: async (reason?: string): Promise<void> => {
      await this.page.click('[data-testid="penalty-button"]');

      if (reason) {
        await this.page.fill('[data-testid="penalty-reason"]', reason);
      }

      await this.page.click('[data-testid="confirm-penalty"]');
    },

    /**
     * Reset game to setup
     */
    resetToSetup: async (): Promise<void> => {
      await this.page.click('[data-testid="reset-game-button"]');
      await this.assertions.gameState("setup");
    },

    /**
     * Start new game from finished state
     */
    startNewGame: async (): Promise<void> => {
      await this.page.click('[data-testid="new-game-button"]');
      await this.assertions.gameState("playing");
    },
  };

  /**
   * UI interaction utilities
   */
  ui = {
    /**
     * Wait for element and click with retry
     */
    clickWithRetry: async (
      selector: string,
      maxRetries: number = 3
    ): Promise<void> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await this.page.click(selector, { timeout: 2000 });
          return;
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await this.page.waitForTimeout(500);
        }
      }
    },

    /**
     * Fill input with validation
     */
    fillAndValidate: async (
      selector: string,
      value: string,
      expectedValue?: string
    ): Promise<void> => {
      await this.page.fill(selector, value);

      if (expectedValue !== undefined) {
        const actualValue = await this.page.inputValue(selector);
        expect(actualValue).toBe(expectedValue);
      }
    },

    /**
     * Take screenshot with context
     */
    screenshotWithContext: async (
      name: string,
      context?: string
    ): Promise<void> => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = context
        ? `${name}-${context}-${timestamp}`
        : `${name}-${timestamp}`;

      await this.page.screenshot({
        path: `test-results/${filename}.png`,
        fullPage: true,
      });
    },

    /**
     * Wait for stable UI (no changes for specified time)
     */
    waitForStableUI: async (timeout: number = 1000): Promise<void> => {
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(timeout);
    },

    /**
     * Get all visible text content
     */
    getAllVisibleText: async (): Promise<string[]> => {
      return await this.page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;

              const style = window.getComputedStyle(parent);
              if (style.display === "none" || style.visibility === "hidden") {
                return NodeFilter.FILTER_REJECT;
              }

              return node.textContent?.trim()
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
            },
          }
        );

        const texts: string[] = [];
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent?.trim();
          if (text) texts.push(text);
        }

        return texts;
      });
    },
  };

  /**
   * Performance testing utilities
   */
  performance = {
    /**
     * Measure page load time
     */
    measurePageLoad: async (): Promise<number> => {
      const startTime = Date.now();
      await this.page.waitForLoadState("networkidle");
      return Date.now() - startTime;
    },

    /**
     * Measure action execution time
     */
    measureAction: async <T>(
      action: () => Promise<T>
    ): Promise<{ result: T; duration: number }> => {
      const startTime = Date.now();
      const result = await action();
      const duration = Date.now() - startTime;
      return { result, duration };
    },

    /**
     * Check for memory leaks (basic)
     */
    checkMemoryUsage: async (): Promise<number> => {
      return await this.page.evaluate(() => {
        if ("memory" in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
    },
  };

  /**
   * Debug utilities
   */
  debug = {
    /**
     * Log current page state
     */
    logPageState: async (): Promise<void> => {
      const url = this.page.url();
      const title = await this.page.title();

      // Determine game state from visual indicators
      let gameState = "unknown";
      try {
        if (
          await this.page
            .locator(
              'button:has-text("Start Game"), button:has-text("Start Team Game"), button:has-text("Need")'
            )
            .first()
            .isVisible()
        ) {
          gameState = "setup";
        } else if (
          await this.page
            .locator('input[type="number"], input[placeholder*="score"]')
            .isVisible()
        ) {
          gameState = "playing";
        } else if (
          await this.page
            .locator('button:has-text("New Game"), button:has-text("Reset")')
            .isVisible()
        ) {
          gameState = "finished";
        }
      } catch (error) {
        // Ignore errors when determining state
      }

      console.log(`Page State Debug:
        URL: ${url}
        Title: ${title}
        Game State: ${gameState}
        Timestamp: ${new Date().toISOString()}
      `);
    },

    /**
     * Log all visible elements with test IDs
     */
    logTestElements: async (): Promise<void> => {
      const elements = await this.page.locator("[data-testid]").all();
      const elementInfo = await Promise.all(
        elements.map(async (el) => ({
          testId: await el.getAttribute("data-testid"),
          text: await el.textContent(),
          visible: await el.isVisible(),
        }))
      );

      console.log("Test Elements:", elementInfo);
    },

    /**
     * Pause execution for manual inspection
     */
    pause: async (message?: string): Promise<void> => {
      if (message) console.log(`Debug pause: ${message}`);
      await this.page.pause();
    },
  };
}

/**
 * Create game test helpers instance
 */
export function createGameHelpers(page: Page): GameTestHelpers {
  return new GameTestHelpers(page);
}

/**
 * Common test data scenarios
 */
export const testScenarios = {
  quickGame: {
    players: [{ name: "Alice" }, { name: "Bob" }],
    gameMode: "individual" as const,
    scoringSequence: [
      {
        playerName: "Alice",
        score: 50,
        scoringType: "single" as const,
        expectedResult: "win" as const,
      },
    ],
  },

  penaltyGame: {
    players: [{ name: "Charlie" }, { name: "Diana" }],
    gameMode: "individual" as const,
    scoringSequence: [
      {
        playerName: "Charlie",
        score: 55,
        scoringType: "single" as const,
        expectedResult: "penalty" as const,
      },
      {
        playerName: "Diana",
        score: 50,
        scoringType: "single" as const,
        expectedResult: "win" as const,
      },
    ],
  },

  teamGame: {
    players: [
      { name: "Player 1" },
      { name: "Player 2" },
      { name: "Player 3" },
      { name: "Player 4" },
    ],
    gameMode: "team" as const,
    teams: [
      { name: "Team A", players: ["Player 1", "Player 2"] },
      { name: "Team B", players: ["Player 3", "Player 4"] },
    ],
  },
};
