/** @format */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Game Results functionality
 * Handles winner display validation, new game initiation, and game history access
 */
export class GameResultsPage extends BasePage {
  // Winner Display Selectors
  private readonly winnerSection =
    '[data-testid="winner-display"], .bg-white:has-text("Wins!")';
  private readonly winnerTitle = 'h2:has-text("Wins!")';
  private readonly winnerName = '.text-green-600:has-text("Wins!")';
  private readonly championStats = '.bg-green-50:has-text("Champion Stats")';
  private readonly finalScore = '.text-green-600:has-text("50")';
  private readonly penaltiesCount = ".text-green-600";
  private readonly confettiDecoration =
    '.flex:has-text("🎉"), .flex:has-text("🎊")';

  // No Winner Display Selectors
  private readonly noWinnerSection =
    '[data-testid="no-winner-display"], .bg-white:has-text("Game Over")';
  private readonly gameOverTitle = 'h2:has-text("Game Over")';
  private readonly eliminationSummary =
    '.bg-red-50:has-text("Elimination Summary")';
  private readonly eliminatedCount = ".text-red-600";

  // Leaderboard Selectors
  private readonly leaderboardSection =
    'h3:has-text("Final Leaderboard"), .bg-gray-50:has-text("Final"), .bg-gray-50:has-text("Standings")';
  private readonly leaderboardTitle =
    'h3:has-text("Final Leaderboard"), h3:has-text("Final Standings")';
  private readonly playerRow = (playerName: string) =>
    `.grid:has-text("${playerName}"), .p-3:has-text("${playerName}")`;
  private readonly teamRow = (teamName: string) =>
    `.grid:has-text("${teamName}"), .p-3:has-text("${teamName}")`;
  private readonly positionCell =
    '.font-bold:has-text("1st"), .font-bold:has-text("2nd"), .font-bold:has-text("3rd")';
  private readonly medalEmoji =
    ':has-text("🥇"), :has-text("🥈"), :has-text("🥉")';

  // Action Button Selectors
  private readonly newGameButton =
    'button:has-text("Start New Game"), button:has-text("New Game")';
  private readonly resetButton =
    'button:has-text("Reset"), button:has-text("Modify Players")';
  private readonly gameHistoryButton =
    'button:has-text("Game History"), button:has-text("View Game History")';

  // Game History Selectors
  private readonly gameHistoryModal =
    '[data-testid="game-history"], .fixed:has-text("Game History")';
  private readonly historyCloseButton =
    'button:has-text("Close"), button[aria-label*="close" i]';
  private readonly historyList =
    '[data-testid="history-list"], .space-y-2:has(.border)';
  private readonly historyItem = (gameNumber: number) =>
    `.border:has-text("Game ${gameNumber}")`;

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for game results page to be ready
   */
  async waitForResultsReady(): Promise<void> {
    // Wait for either winner or no-winner display
    try {
      await this.waitForElement(this.winnerSection, { timeout: 2000 });
    } catch {
      await this.waitForElement(this.noWinnerSection);
    }

    await this.waitForElement(this.leaderboardSection);
  }

  /**
   * Check if game ended with a winner
   */
  async hasWinner(): Promise<boolean> {
    try {
      await this.waitForElement(this.winnerSection, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if game ended without a winner
   */
  async hasNoWinner(): Promise<boolean> {
    try {
      await this.waitForElement(this.noWinnerSection, { timeout: 1000 });
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
      await this.waitForElement(this.winnerName);
      const text = await this.getElementText(this.winnerName);

      // Extract winner name from text like "PlayerName Wins!"
      const match = text.match(/(.+)\s+Wins!/);
      return match ? match[1].trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Get winner's final statistics
   */
  async getWinnerStats(): Promise<{
    finalScore: number;
    penalties: number;
  } | null> {
    try {
      await this.waitForElement(this.championStats);
      const statsText = await this.getElementText(this.championStats);

      // Extract final score (format: "50 Final Score 0 Penalties")
      const scoreMatch = statsText.match(/(\d+)\s+Final\s+Score/);
      const finalScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 50;

      // Extract penalties count (format: "50 Final Score 0 Penalties")
      const penaltyMatch = statsText.match(/Final\s+Score\s+(\d+)\s+Penalties/);
      const penalties = penaltyMatch ? parseInt(penaltyMatch[1], 10) : 0;

      return { finalScore, penalties };
    } catch {
      return null;
    }
  }

  /**
   * Get elimination summary (for no-winner games)
   */
  async getEliminationSummary(): Promise<{
    eliminatedCount: number;
    totalCount: number;
  } | null> {
    try {
      await this.waitForElement(this.eliminationSummary);

      const summaryText = await this.getElementText(this.eliminationSummary);

      // Extract eliminated count
      const eliminatedMatch = summaryText.match(
        /(\d+)\s*(?:Players?|Teams?)\s*Eliminated/
      );
      const eliminatedCount = eliminatedMatch
        ? parseInt(eliminatedMatch[1], 10)
        : 0;

      // Extract total count
      const totalMatch = summaryText.match(
        /(\d+)\s*Total\s*(?:Players?|Teams?)/
      );
      const totalCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;

      return { eliminatedCount, totalCount };
    } catch {
      return null;
    }
  }

  /**
   * Get final leaderboard standings
   */
  async getFinalStandings(): Promise<
    Array<{
      position: number;
      name: string;
      score: number;
      status: string;
      isWinner?: boolean;
      isEliminated?: boolean;
    }>
  > {
    await this.waitForElement(this.leaderboardSection);

    const standings: Array<{
      position: number;
      name: string;
      score: number;
      status: string;
      isWinner?: boolean;
      isEliminated?: boolean;
    }> = [];

    // Get all player/team rows
    const rows = await this.getAllElements(
      ".grid:has(.font-bold), .p-3:has(.font-medium)"
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const text = await row.textContent();

      if (!text) continue;

      // Extract position
      const positionMatch = text.match(/(\d+)(?:st|nd|rd|th)/);
      const position = positionMatch ? parseInt(positionMatch[1], 10) : i + 1;

      // Extract name
      const nameMatch = text.match(
        /(?:\d+(?:st|nd|rd|th)?\s*(?:🥇|🥈|🥉)?\s*)([^0-9]+?)(?:\s*\d+\s*$|\s*Winner|\s*Eliminated)/
      );
      const name = nameMatch ? nameMatch[1].trim() : "";

      // Extract score
      const scoreMatch = text.match(/(\d+)\s*$/);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

      // Determine status
      let status = "Active";
      let isWinner = false;
      let isEliminated = false;

      if (text.includes("Winner")) {
        status = "Winner";
        isWinner = true;
      } else if (text.includes("Eliminated")) {
        status = "Eliminated";
        isEliminated = true;
      }

      if (name) {
        standings.push({
          position,
          name,
          score,
          status,
          isWinner,
          isEliminated,
        });
      }
    }

    return standings;
  }

  /**
   * Get player position in final standings
   */
  async getPlayerPosition(playerName: string): Promise<number | null> {
    const standings = await this.getFinalStandings();
    const player = standings.find((p) => p.name === playerName);
    return player ? player.position : null;
  }

  /**
   * Check if player has medal (top 3 position)
   */
  async playerHasMedal(
    playerName: string
  ): Promise<{ hasMedal: boolean; medal?: string }> {
    const position = await this.getPlayerPosition(playerName);

    if (!position || position > 3) {
      return { hasMedal: false };
    }

    const medals = ["🥇", "🥈", "🥉"];
    return {
      hasMedal: true,
      medal: medals[position - 1],
    };
  }

  /**
   * Start a new game with same players
   */
  async startNewGame(): Promise<void> {
    await this.waitForElement(this.newGameButton);
    await this.clickElement(this.newGameButton);

    // Wait for navigation back to game setup or new game start
    await this.page.waitForTimeout(1000);
  }

  /**
   * Reset game and modify players
   */
  async resetAndModifyPlayers(): Promise<void> {
    await this.waitForElement(this.resetButton);
    await this.clickElement(this.resetButton);

    // Wait for navigation back to setup
    await this.page.waitForTimeout(1000);
  }

  /**
   * Open game history
   */
  async openGameHistory(): Promise<void> {
    await this.clickElement(this.gameHistoryButton);

    // Wait for history modal to appear
    await this.waitForElement(this.gameHistoryModal);
  }

  /**
   * Close game history
   */
  async closeGameHistory(): Promise<void> {
    await this.waitForElement(this.gameHistoryModal);
    await this.clickElement(this.historyCloseButton);

    // Wait for modal to close
    await this.waitForElement(this.gameHistoryModal, { visible: false });
  }

  /**
   * Get game history entries
   */
  async getGameHistory(): Promise<
    Array<{
      gameNumber: number;
      winner: string;
      date: string;
      players: string[];
    }>
  > {
    await this.openGameHistory();

    const history: Array<{
      gameNumber: number;
      winner: string;
      date: string;
      players: string[];
    }> = [];

    try {
      await this.waitForElement(this.historyList, { timeout: 2000 });

      const historyItems = await this.getAllElements(
        '.border:has-text("Game")'
      );

      for (const item of historyItems) {
        const text = await item.textContent();
        if (!text) continue;

        // Extract game number
        const gameMatch = text.match(/Game (\d+)/);
        const gameNumber = gameMatch ? parseInt(gameMatch[1], 10) : 0;

        // Extract winner
        const winnerMatch = text.match(/Winner:\s*([^,\n]+)/);
        const winner = winnerMatch ? winnerMatch[1].trim() : "";

        // Extract date
        const dateMatch = text.match(/Date:\s*([^,\n]+)/);
        const date = dateMatch ? dateMatch[1].trim() : "";

        // Extract players
        const playersMatch = text.match(/Players:\s*([^,\n]+)/);
        const playersText = playersMatch ? playersMatch[1] : "";
        const players = playersText
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p);

        if (gameNumber > 0) {
          history.push({
            gameNumber,
            winner,
            date,
            players,
          });
        }
      }
    } catch {
      // No history available
    }

    await this.closeGameHistory();
    return history;
  }

  /**
   * Get specific game from history
   */
  async getGameFromHistory(gameNumber: number): Promise<{
    winner: string;
    date: string;
    players: string[];
  } | null> {
    const history = await this.getGameHistory();
    const game = history.find((g) => g.gameNumber === gameNumber);

    if (!game) return null;

    return {
      winner: game.winner,
      date: game.date,
      players: game.players,
    };
  }

  /**
   * Check if new game button is available
   */
  async isNewGameAvailable(): Promise<boolean> {
    try {
      await this.waitForElement(this.newGameButton, { timeout: 1000 });
      return await this.isElementEnabled(this.newGameButton);
    } catch {
      return false;
    }
  }

  /**
   * Check if reset button is available
   */
  async isResetAvailable(): Promise<boolean> {
    try {
      await this.waitForElement(this.resetButton, { timeout: 1000 });
      return await this.isElementEnabled(this.resetButton);
    } catch {
      return false;
    }
  }

  /**
   * Check if game history button is available
   */
  async isGameHistoryAvailable(): Promise<boolean> {
    try {
      await this.waitForElement(this.gameHistoryButton, { timeout: 1000 });
      return await this.isElementEnabled(this.gameHistoryButton);
    } catch {
      return false;
    }
  }

  /**
   * Validate winner display elements
   */
  async validateWinnerDisplay(expectedWinner: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check winner section is visible
      await this.waitForElement(this.winnerSection);

      // Check winner name
      const winnerName = await this.getWinnerName();
      if (winnerName !== expectedWinner) {
        errors.push(`Expected winner "${expectedWinner}", got "${winnerName}"`);
      }

      // Check winner stats
      const stats = await this.getWinnerStats();
      if (!stats) {
        errors.push("Winner stats not found");
      } else if (stats.finalScore !== 50) {
        errors.push(`Expected final score 50, got ${stats.finalScore}`);
      }

      // Check confetti decoration
      const hasConfetti = await this.isElementVisible('.flex:has-text("🎉")');
      if (!hasConfetti) {
        errors.push("Confetti decoration not found");
      }

      // Check leaderboard
      const standings = await this.getFinalStandings();
      const winner = standings.find((p) => p.name === expectedWinner);
      if (!winner || winner.position !== 1) {
        errors.push(`Winner not in first position in leaderboard`);
      }
    } catch (error) {
      errors.push(`Failed to validate winner display: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate no-winner display elements
   */
  async validateNoWinnerDisplay(): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check no-winner section is visible
      await this.waitForElement(this.noWinnerSection);

      // Check game over title
      const hasGameOverTitle = await this.isElementVisible(this.gameOverTitle);
      if (!hasGameOverTitle) {
        errors.push("Game Over title not found");
      }

      // Check elimination summary
      const summary = await this.getEliminationSummary();
      if (!summary) {
        errors.push("Elimination summary not found");
      } else if (summary.eliminatedCount === 0) {
        errors.push("No eliminated players/teams found in summary");
      }

      // Check leaderboard shows eliminated status
      const standings = await this.getFinalStandings();
      const hasEliminatedPlayers = standings.some((p) => p.isEliminated);
      if (!hasEliminatedPlayers) {
        errors.push("No eliminated players found in leaderboard");
      }
    } catch (error) {
      errors.push(`Failed to validate no-winner display: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Assert winner is displayed correctly
   */
  async assertWinnerDisplay(expectedWinner: string): Promise<void> {
    const validation = await this.validateWinnerDisplay(expectedWinner);

    if (!validation.isValid) {
      throw new Error(
        `Winner display validation failed: ${validation.errors.join(", ")}`
      );
    }
  }

  /**
   * Assert no-winner display is shown correctly
   */
  async assertNoWinnerDisplay(): Promise<void> {
    const validation = await this.validateNoWinnerDisplay();

    if (!validation.isValid) {
      throw new Error(
        `No-winner display validation failed: ${validation.errors.join(", ")}`
      );
    }
  }

  /**
   * Assert player position in leaderboard
   */
  async assertPlayerPosition(
    playerName: string,
    expectedPosition: number
  ): Promise<void> {
    const actualPosition = await this.getPlayerPosition(playerName);
    expect(actualPosition).toBe(expectedPosition);
  }

  /**
   * Assert player has medal
   */
  async assertPlayerHasMedal(
    playerName: string,
    expectedMedal?: string
  ): Promise<void> {
    const medalInfo = await this.playerHasMedal(playerName);
    expect(medalInfo.hasMedal).toBe(true);

    if (expectedMedal) {
      expect(medalInfo.medal).toBe(expectedMedal);
    }
  }

  /**
   * Assert new game button is available
   */
  async assertNewGameAvailable(): Promise<void> {
    const isAvailable = await this.isNewGameAvailable();
    expect(isAvailable).toBe(true);
  }

  /**
   * Assert reset button is available
   */
  async assertResetAvailable(): Promise<void> {
    const isAvailable = await this.isResetAvailable();
    expect(isAvailable).toBe(true);
  }

  /**
   * Assert game history is accessible
   */
  async assertGameHistoryAccessible(): Promise<void> {
    const isAvailable = await this.isGameHistoryAvailable();
    expect(isAvailable).toBe(true);
  }
}
