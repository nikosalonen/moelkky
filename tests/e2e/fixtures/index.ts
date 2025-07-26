/** @format */

import { test as base, Page } from "@playwright/test";
import type { Player, Team, GameMode } from "../../../src/utils/types";

/**
 * Test data interfaces for Playwright fixtures
 */
export interface TestPlayer {
  name: string;
  expectedScore?: number;
  shouldWin?: boolean;
}

export interface TestTeam {
  name: string;
  players: string[];
}

export interface TestGameScenario {
  players: TestPlayer[];
  gameMode: GameMode;
  teams?: TestTeam[];
  expectedWinner?: string;
  scoringSequence?: ScoringAction[];
}

export interface ScoringAction {
  playerName: string;
  score: number;
  scoringType: "single" | "multiple";
  expectedResult?: "continue" | "penalty" | "win";
}

/**
 * Custom fixtures for game testing
 */
export interface GameFixtures {
  gameData: GameTestData;
  gameSetup: GameSetupFixture;
}

/**
 * Game test data fixture providing common test scenarios
 */
export class GameTestData {
  /**
   * Generate test players with default names
   */
  generatePlayers(count: number, namePrefix: string = "Player"): TestPlayer[] {
    return Array.from({ length: count }, (_, i) => ({
      name: `${namePrefix} ${i + 1}`,
    }));
  }

  /**
   * Generate test teams with players
   */
  generateTeams(teamCount: number, playersPerTeam: number = 2): TestTeam[] {
    const teams: TestTeam[] = [];
    let playerIndex = 1;

    for (let i = 0; i < teamCount; i++) {
      const players: string[] = [];
      for (let j = 0; j < playersPerTeam; j++) {
        players.push(`Player ${playerIndex++}`);
      }
      teams.push({
        name: `Team ${i + 1}`,
        players,
      });
    }

    return teams;
  }

  /**
   * Create a basic individual game scenario
   */
  basicIndividualGame(playerCount: number = 2): TestGameScenario {
    return {
      players: this.generatePlayers(playerCount),
      gameMode: "individual",
    };
  }

  /**
   * Create a basic team game scenario
   */
  basicTeamGame(
    teamCount: number = 2,
    playersPerTeam: number = 2
  ): TestGameScenario {
    const teams = this.generateTeams(teamCount, playersPerTeam);
    const allPlayers: TestPlayer[] = [];

    teams.forEach((team) => {
      team.players.forEach((playerName) => {
        allPlayers.push({ name: playerName });
      });
    });

    return {
      players: allPlayers,
      gameMode: "team",
      teams,
    };
  }

  /**
   * Create a game scenario with predetermined winner
   */
  gameWithWinner(winnerName: string = "Player 1"): TestGameScenario {
    return {
      players: [{ name: winnerName, shouldWin: true }, { name: "Player 2" }],
      gameMode: "individual",
      expectedWinner: winnerName,
      scoringSequence: [
        {
          playerName: winnerName,
          score: 50,
          scoringType: "single",
          expectedResult: "win",
        },
      ],
    };
  }

  /**
   * Create a game scenario with penalty situations
   */
  gameWithPenalties(): TestGameScenario {
    return {
      players: [{ name: "Player 1" }, { name: "Player 2" }],
      gameMode: "individual",
      scoringSequence: [
        {
          playerName: "Player 1",
          score: 45,
          scoringType: "single",
          expectedResult: "continue",
        },
        {
          playerName: "Player 2",
          score: 30,
          scoringType: "single",
          expectedResult: "continue",
        },
        {
          playerName: "Player 1",
          score: 55,
          scoringType: "single",
          expectedResult: "penalty",
        }, // Over 50, should reset to 25
      ],
    };
  }

  /**
   * Create a complex scoring scenario
   */
  complexScoringGame(): TestGameScenario {
    return {
      players: [
        { name: "Player 1" },
        { name: "Player 2" },
        { name: "Player 3" },
      ],
      gameMode: "individual",
      scoringSequence: [
        {
          playerName: "Player 1",
          score: 12,
          scoringType: "multiple",
          expectedResult: "continue",
        },
        {
          playerName: "Player 2",
          score: 8,
          scoringType: "single",
          expectedResult: "continue",
        },
        {
          playerName: "Player 3",
          score: 15,
          scoringType: "multiple",
          expectedResult: "continue",
        },
        {
          playerName: "Player 1",
          score: 20,
          scoringType: "single",
          expectedResult: "continue",
        },
        {
          playerName: "Player 2",
          score: 25,
          scoringType: "multiple",
          expectedResult: "continue",
        },
        {
          playerName: "Player 3",
          score: 18,
          scoringType: "single",
          expectedResult: "continue",
        },
        {
          playerName: "Player 1",
          score: 18,
          scoringType: "single",
          expectedResult: "win",
        }, // Total: 50
      ],
    };
  }

  /**
   * Get random player names for variety in tests
   */
  getRandomPlayerNames(count: number): string[] {
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
      "Quinn",
      "Ruby",
      "Sam",
      "Tara",
      "Uma",
      "Victor",
      "Wendy",
      "Xander",
      "Yara",
      "Zoe",
    ];

    const shuffled = [...names].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Create edge case scenarios for testing
   */
  edgeCaseScenarios = {
    /**
     * Minimum players scenario
     */
    minimumPlayers: (): TestGameScenario => ({
      players: this.generatePlayers(2),
      gameMode: "individual",
    }),

    /**
     * Maximum reasonable players scenario
     */
    manyPlayers: (): TestGameScenario => ({
      players: this.generatePlayers(8),
      gameMode: "individual",
    }),

    /**
     * Single team scenario (edge case)
     */
    singleTeam: (): TestGameScenario => {
      const teams = this.generateTeams(1, 3);
      return {
        players: teams[0].players.map((name) => ({ name })),
        gameMode: "team",
        teams,
      };
    },

    /**
     * Empty names scenario (for validation testing)
     */
    emptyNames: (): TestGameScenario => ({
      players: [{ name: "" }, { name: "Valid Player" }],
      gameMode: "individual",
    }),

    /**
     * Duplicate names scenario (for validation testing)
     */
    duplicateNames: (): TestGameScenario => ({
      players: [{ name: "Player 1" }, { name: "Player 1" }],
      gameMode: "individual",
    }),
  };
}

/**
 * Game setup fixture for common setup operations
 */
export class GameSetupFixture {
  constructor(private page: Page) {}

  /**
   * Clear any existing game state
   */
  async clearGameState(): Promise<void> {
    try {
      await this.page.evaluate(() => {
        // Clear session storage
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.clear();
        }
        // Clear local storage if used
        if (typeof localStorage !== "undefined") {
          localStorage.clear();
        }
      });
    } catch (error) {
      // Ignore security errors when clearing storage
      console.log("Note: Could not clear storage due to security restrictions");
    }
  }

  /**
   * Set up a fresh game environment
   */
  async setupFreshGame(): Promise<void> {
    await this.clearGameState();
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for game to be in specific state
   */
  async waitForGameState(
    expectedState: "setup" | "playing" | "finished",
    timeout: number = 5000
  ): Promise<void> {
    // For now, we'll use visual indicators to determine game state
    // This can be improved once we add proper data attributes to the app
    if (expectedState === "setup") {
      await this.page.waitForSelector(
        'button:has-text("Start Game"), button:has-text("Start Team Game"), button:has-text("Need")',
        { timeout }
      );
    } else if (expectedState === "playing") {
      await this.page.waitForSelector(
        'input[type="number"], input[placeholder*="score"]',
        { timeout }
      );
    } else if (expectedState === "finished") {
      await this.page.waitForSelector(
        'button:has-text("New Game"), button:has-text("Reset")',
        { timeout }
      );
    }
  }

  /**
   * Setup game with specific scenario
   */
  async setupGameScenario(scenario: TestGameScenario): Promise<void> {
    await this.setupFreshGame();

    // Set game mode if not individual
    if (scenario.gameMode === "team") {
      // Implementation will depend on actual UI
      await this.page.click('[data-testid="team-mode-button"]');
    }

    // Add players
    for (const player of scenario.players) {
      await this.addPlayer(player.name);
    }

    // Setup teams if team mode
    if (scenario.gameMode === "team" && scenario.teams) {
      for (const team of scenario.teams) {
        await this.createTeam(team.name, team.players);
      }
    }
  }

  /**
   * Add a player to the game
   */
  async addPlayer(name: string): Promise<void> {
    await this.page.fill('[data-testid="player-name-input"]', name);
    await this.page.click('[data-testid="add-player-button"]');
  }

  /**
   * Create a team with players
   */
  async createTeam(teamName: string, playerNames: string[]): Promise<void> {
    // Implementation will depend on actual team creation UI
    await this.page.click('[data-testid="create-team-button"]');
    await this.page.fill('[data-testid="team-name-input"]', teamName);

    for (const playerName of playerNames) {
      await this.page.click(`[data-testid="player-${playerName}"]`);
    }

    await this.page.click('[data-testid="confirm-team-button"]');
  }

  /**
   * Start the game
   */
  async startGame(): Promise<void> {
    await this.page.click('[data-testid="start-game-button"]');
    await this.waitForGameState("playing");
  }

  /**
   * Execute a scoring sequence
   */
  async executeScoring(sequence: ScoringAction[]): Promise<void> {
    for (const action of sequence) {
      await this.submitScore(action.score, action.scoringType);

      // Wait for UI to update
      await this.page.waitForTimeout(500);

      // Verify expected result if specified
      if (action.expectedResult === "win") {
        await this.waitForGameState("finished");
        break;
      } else if (action.expectedResult === "penalty") {
        // Verify penalty was applied (implementation specific)
        await this.page.waitForSelector('[data-testid="penalty-applied"]', {
          timeout: 2000,
        });
      }
    }
  }

  /**
   * Submit a score for the current player
   */
  async submitScore(
    score: number,
    scoringType: "single" | "multiple" = "single"
  ): Promise<void> {
    // Select scoring type
    if (scoringType === "multiple") {
      await this.page.click('[data-testid="multiple-scoring-button"]');
    }

    // Enter score
    await this.page.fill('[data-testid="score-input"]', score.toString());
    await this.page.click('[data-testid="submit-score-button"]');
  }

  /**
   * Apply penalty to current player
   */
  async applyPenalty(reason?: string): Promise<void> {
    await this.page.click('[data-testid="penalty-button"]');

    if (reason) {
      await this.page.fill('[data-testid="penalty-reason-input"]', reason);
    }

    await this.page.click('[data-testid="confirm-penalty-button"]');
  }

  /**
   * Reset game to setup
   */
  async resetGame(): Promise<void> {
    await this.page.click('[data-testid="reset-game-button"]');
    await this.waitForGameState("setup");
  }

  /**
   * Start new game (from finished state)
   */
  async startNewGame(): Promise<void> {
    await this.page.click('[data-testid="new-game-button"]');
    await this.waitForGameState("playing");
  }
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<GameFixtures>({
  gameData: async ({}, use) => {
    const gameData = new GameTestData();
    await use(gameData);
  },

  gameSetup: async ({ page }, use) => {
    const gameSetup = new GameSetupFixture(page);
    await use(gameSetup);
  },
});

export { expect } from "@playwright/test";
