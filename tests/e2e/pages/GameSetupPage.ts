/** @format */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Game Setup functionality
 * Handles player management, game mode selection, and team setup
 */
export class GameSetupPage extends BasePage {
  // Game Mode Selectors
  private readonly gameModeSection = '.bg-white:has(h2:has-text("Game Mode"))';
  private readonly individualModeButton = 'button:has-text("Individual")';
  private readonly teamModeButton = 'button:has-text("Team")';

  // Player Management Selectors
  private readonly playerSection = '.bg-white:has(h2:has-text("Players"))';
  private readonly playerNameInput =
    'input[aria-label="Player name"], input[placeholder*="player name" i]';
  private readonly addPlayerButton = 'button:has-text("Add Player")';
  private readonly playerList = '.space-y-2:has(.flex:has-text("1."))';
  private readonly playerItem = (playerName: string) =>
    `.flex.flex-col.sm\\:flex-row.sm\\:items-center.justify-between:has-text("${playerName}")`;
  private readonly editPlayerButton = (playerName: string) =>
    `${this.playerItem(playerName)} button:has-text("Edit")`;
  private readonly removePlayerButton = (playerName: string) =>
    `${this.playerItem(playerName)} button:has-text("Remove")`;
  private readonly editPlayerInput = 'input[aria-label="Edit player name"]';
  private readonly saveEditButton = 'button:has-text("Save")';
  private readonly cancelEditButton = 'button:has-text("Cancel")';
  private readonly confirmRemoveButton =
    'button:has-text("Remove"):not(:has-text("Cancel"))';
  private readonly cancelRemoveButton = 'button:has-text("Cancel")';

  // Team Management Selectors
  private readonly teamSection =
    '[data-testid="team-manager"], .bg-white:has-text("Team Management")';
  private readonly teamNameInput =
    'input[id="newTeamName"], input[placeholder*="team name" i]';
  private readonly createTeamButton = 'button:has-text("Create Team")';
  private readonly teamList =
    '[data-testid="team-list"], .space-y-3:has(.border:has-text("Team"))';
  private readonly teamItem = (teamName: string) =>
    `.border:has-text("${teamName}")`;
  private readonly playerCheckbox = (playerName: string) =>
    `input[type="checkbox"] + span:has-text("${playerName}")`;

  // Start Game Selectors
  private readonly startGameButton =
    'button[type="button"]:has-text("Start Game")';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to the game setup page
   */
  async navigateToSetup(): Promise<void> {
    await this.goto("/");
    await this.waitForPageLoad();
    await this.waitForElement(this.playerSection);
  }

  /**
   * Select game mode (individual or team)
   */
  async selectGameMode(mode: "individual" | "team"): Promise<void> {
    await this.waitForElement(this.gameModeSection);

    const modeButton =
      mode === "individual" ? this.individualModeButton : this.teamModeButton;
    await this.clickElement(modeButton);

    // Wait for mode selection to be applied
    await this.page.waitForTimeout(500);

    // Verify mode is selected by checking button state
    // Use first() to handle multiple matches
    const selectedButton = this.page.locator(modeButton).first();
    await expect(selectedButton).toHaveClass(
      /border-blue-500|border-green-500/
    );
  }

  /**
   * Add a player to the game
   */
  async addPlayer(playerName: string): Promise<void> {
    await this.waitForElement(this.playerNameInput);
    await this.fillInput(this.playerNameInput, playerName);
    await this.clickElement(this.addPlayerButton);

    // Wait for player to appear in the list
    await this.waitForElement(this.playerItem(playerName));
  }

  /**
   * Remove a player from the game
   */
  async removePlayer(playerName: string): Promise<void> {
    const playerElement = this.playerItem(playerName);
    await this.waitForElement(playerElement);

    // Click remove button
    await this.clickElement(this.removePlayerButton(playerName));

    // Confirm removal in modal
    await this.waitForElement(this.confirmRemoveButton);
    await this.clickElement(this.confirmRemoveButton);

    // Wait for player to be removed from list
    await this.waitForElement(playerElement, { visible: false });
  }

  /**
   * Edit a player's name
   */
  async editPlayer(currentName: string, newName: string): Promise<void> {
    const playerElement = this.playerItem(currentName);
    await this.waitForElement(playerElement);

    // Click edit button
    await this.clickElement(this.editPlayerButton(currentName));

    // Wait for edit input to appear and fill new name
    await this.waitForElement(this.editPlayerInput);
    await this.fillInput(this.editPlayerInput, newName);

    // Save the edit
    await this.clickElement(this.saveEditButton);

    // Wait for new name to appear
    await this.waitForElement(this.playerItem(newName));
  }

  /**
   * Cancel editing a player's name
   */
  async cancelEditPlayer(playerName: string): Promise<void> {
    const playerElement = this.playerItem(playerName);
    await this.waitForElement(playerElement);

    // Click edit button
    await this.clickElement(this.editPlayerButton(playerName));

    // Wait for edit input and cancel
    await this.waitForElement(this.editPlayerInput);
    await this.clickElement(this.cancelEditButton);

    // Verify edit mode is cancelled
    await this.waitForElement(this.editPlayerInput, { visible: false });
  }

  /**
   * Get list of all players currently added
   */
  async getPlayerList(): Promise<string[]> {
    const players: string[] = [];

    try {
      // Wait for player list to be present
      await this.waitForElement(this.playerList, { timeout: 2000 });

      // Get all player items using the same selector as playerItem
      const playerElements = await this.getAllElements(
        ".flex.flex-col.sm\\:flex-row.sm\\:items-center.justify-between"
      );

      for (const element of playerElements) {
        const text = await element.textContent();
        if (text) {
          // Extract player name (format: "1. PlayerName")
          const match = text.match(/\d+\.\s*([^(]+)/);
          if (match) {
            players.push(match[1].trim());
          }
        }
      }
    } catch (error) {
      // Return empty array if no players found
      return [];
    }

    return players;
  }

  /**
   * Create a team with specified players (team mode only)
   */
  async createTeam(teamName: string, playerNames: string[]): Promise<void> {
    await this.waitForElement(this.teamSection);

    // Fill team name
    await this.fillInput(this.teamNameInput, teamName);

    // Select players for the team
    for (const playerName of playerNames) {
      const checkbox = this.page
        .locator(this.playerCheckbox(playerName))
        .locator("..")
        .locator('input[type="checkbox"]');
      await checkbox.check();
    }

    // Create the team
    await this.clickElement(this.createTeamButton);

    // Wait for team to appear in list
    await this.waitForElement(this.teamItem(teamName));
  }

  /**
   * Get list of all teams currently created
   */
  async getTeamList(): Promise<Array<{ name: string; players: string[] }>> {
    const teams: Array<{ name: string; players: string[] }> = [];

    try {
      await this.waitForElement(this.teamList, { timeout: 2000 });

      const teamElements = await this.getAllElements(
        ".border:has(.font-medium)"
      );

      for (const element of teamElements) {
        const text = await element.textContent();
        if (text) {
          // Extract team name and players
          const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line);
          const teamName = lines[0];

          // Find players line (contains numbers and names)
          const playersLine = lines.find(
            (line) => line.includes("1.") || line.includes("Players:")
          );
          const players: string[] = [];

          if (playersLine) {
            // Extract player names from format "1. Player1, 2. Player2"
            const playerMatches = playersLine.match(/\d+\.\s*([^,\d]+)/g);
            if (playerMatches) {
              players.push(
                ...playerMatches.map((match) =>
                  match.replace(/\d+\.\s*/, "").trim()
                )
              );
            }
          }

          teams.push({ name: teamName, players });
        }
      }
    } catch (error) {
      // Return empty array if no teams found
      return [];
    }

    return teams;
  }

  /**
   * Check if the start game button is enabled
   */
  async canStartGame(): Promise<boolean> {
    try {
      // Check if start game button exists and is enabled
      const button = this.page.locator(this.startGameButton);
      await button.waitFor({ timeout: 2000 });
      
      // Check if button is enabled (not disabled)
      const isDisabled = await button.getAttribute('disabled');
      const hasDisabledClass = await button.getAttribute('class');
      
      return !isDisabled && !hasDisabledClass?.includes('disabled');
    } catch {
      return false;
    }
  }

  /**
   * Start the game
   */
  async startGame(): Promise<void> {
    await this.waitForElement(this.startGameButton);
    await this.assertElementEnabled(this.startGameButton);
    await this.clickElement(this.startGameButton);

    // Wait for game to start (page should change to playing state)
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the current game mode
   */
  async getCurrentGameMode(): Promise<"individual" | "team" | null> {
    try {
      const individualButton = this.page.locator(this.individualModeButton);
      const teamButton = this.page.locator(this.teamModeButton);

      const individualSelected = await individualButton.getAttribute("class");
      const teamSelected = await teamButton.getAttribute("class");

      if (individualSelected?.includes("border-blue-500")) {
        return "individual";
      } else if (teamSelected?.includes("border-green-500")) {
        return "team";
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Validate that minimum players are added for game start
   */
  async validateMinimumPlayers(): Promise<{
    isValid: boolean;
    message: string;
  }> {
    const players = await this.getPlayerList();
    const gameMode = await this.getCurrentGameMode();

    if (gameMode === "individual") {
      if (players.length < 2) {
        return {
          isValid: false,
          message: `Need ${2 - players.length} more player${players.length === 1 ? "" : "s"} to start`,
        };
      }
    } else if (gameMode === "team") {
      const teams = await this.getTeamList();
      if (teams.length < 2) {
        return {
          isValid: false,
          message: `Need ${2 - teams.length} more team${teams.length === 1 ? "" : "s"} to start`,
        };
      }
    }

    return { isValid: true, message: "Ready to start game" };
  }

  /**
   * Validate team setup requirements
   */
  async validateTeamSetup(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const teams = await this.getTeamList();

    if (teams.length < 2) {
      errors.push("At least 2 teams are required");
    }

    for (const team of teams) {
      if (team.players.length === 0) {
        errors.push(`Team "${team.name}" has no players`);
      }
      if (team.players.length > 4) {
        errors.push(`Team "${team.name}" has too many players (max 4)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get the start game button text/status
   */
  async getStartGameButtonText(): Promise<string> {
    try {
      await this.waitForElement(this.startGameButton, { timeout: 2000 });
      return await this.getElementText(this.startGameButton);
    } catch {
      return "";
    }
  }

  /**
   * Wait for game setup page to be ready
   */
  async waitForSetupReady(): Promise<void> {
    await this.waitForElement(this.playerSection);
    await this.waitForElement(this.gameModeSection);
    await this.waitForElement(this.startGameButton);
  }

  /**
   * Assert that a player exists in the list
   */
  async assertPlayerExists(playerName: string): Promise<void> {
    await this.assertElementVisible(
      this.playerItem(playerName),
      `Player "${playerName}" should be visible`
    );
  }

  /**
   * Assert that a player does not exist in the list
   */
  async assertPlayerNotExists(playerName: string): Promise<void> {
    const element = this.page.locator(this.playerItem(playerName));
    await expect(element).not.toBeVisible();
  }

  /**
   * Assert that a team exists in the list
   */
  async assertTeamExists(teamName: string): Promise<void> {
    await this.assertElementVisible(
      this.teamItem(teamName),
      `Team "${teamName}" should be visible`
    );
  }

  /**
   * Assert game mode is selected
   */
  async assertGameModeSelected(mode: "individual" | "team"): Promise<void> {
    const currentMode = await this.getCurrentGameMode();
    expect(currentMode).toBe(mode);
  }

  /**
   * Assert start game button state
   */
  async assertStartGameEnabled(enabled: boolean = true): Promise<void> {
    await this.assertElementEnabled(this.startGameButton, enabled);
  }
}
