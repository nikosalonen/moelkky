/** @format */

import { test, expect } from "@playwright/test";
import { GameSetupPage } from "../pages/GameSetupPage";
import { GamePlayPage } from "../pages/GamePlayPage";
import { GameResultsPage } from "../pages/GameResultsPage";

test.describe("Page Object Model Tests", () => {
  test("GameSetupPage should work correctly", async ({ page }) => {
    const setupPage = new GameSetupPage(page);

    // Navigate to setup
    await setupPage.navigateToSetup();

    // Verify we can interact with game mode selection
    await setupPage.selectGameMode("individual");
    const currentMode = await setupPage.getCurrentGameMode();
    expect(currentMode).toBe("individual");

    // Add players
    await setupPage.addPlayer("Alice");
    await setupPage.addPlayer("Bob");

    // Verify players were added
    await setupPage.assertPlayerExists("Alice");
    await setupPage.assertPlayerExists("Bob");

    const players = await setupPage.getPlayerList();
    expect(players).toContain("Alice");
    expect(players).toContain("Bob");

    // Verify game can be started
    const canStart = await setupPage.canStartGame();
    expect(canStart).toBe(true);

    // Verify validation works
    const validation = await setupPage.validateMinimumPlayers();
    expect(validation.isValid).toBe(true);
  });

  test("GameSetupPage should handle team mode", async ({ page }) => {
    const setupPage = new GameSetupPage(page);

    await setupPage.navigateToSetup();

    // Switch to team mode
    await setupPage.selectGameMode("team");
    await setupPage.assertGameModeSelected("team");

    // Add players first
    await setupPage.addPlayer("Player 1");
    await setupPage.addPlayer("Player 2");
    await setupPage.addPlayer("Player 3");
    await setupPage.addPlayer("Player 4");

    // Create teams
    await setupPage.createTeam("Team A", ["Player 1", "Player 2"]);
    await setupPage.createTeam("Team B", ["Player 3", "Player 4"]);

    // Verify teams were created
    await setupPage.assertTeamExists("Team A");
    await setupPage.assertTeamExists("Team B");

    const teams = await setupPage.getTeamList();
    expect(teams).toHaveLength(2);
    expect(teams[0].name).toBe("Team A");
    expect(teams[0].players).toEqual(["Player 1", "Player 2"]);
  });

  test("GamePlayPage should work correctly", async ({ page }) => {
    const setupPage = new GameSetupPage(page);
    const playPage = new GamePlayPage(page);

    // Setup a game first
    await setupPage.navigateToSetup();
    await setupPage.selectGameMode("individual");
    await setupPage.addPlayer("Alice");
    await setupPage.addPlayer("Bob");
    await setupPage.startGame();

    // Wait for game to start
    await playPage.waitForGamePlayReady();

    // Verify current player
    const currentPlayer = await playPage.getCurrentPlayerName();
    expect(currentPlayer).toBe("Alice");

    // Test score submission
    await playPage.selectPins([10]);
    await playPage.submitScore();

    // Verify turn advanced
    await playPage.waitForPlayerTurn("Bob", 3000);
    const nextPlayer = await playPage.getCurrentPlayerName();
    expect(nextPlayer).toBe("Bob");
  });

  test("GamePlayPage should handle pin selection", async ({ page }) => {
    const setupPage = new GameSetupPage(page);
    const playPage = new GamePlayPage(page);

    // Setup a game
    await setupPage.navigateToSetup();
    await setupPage.selectGameMode("individual");
    await setupPage.addPlayer("Charlie");
    await setupPage.addPlayer("Diana");
    await setupPage.startGame();

    await playPage.waitForGamePlayReady();

    // Test single pin selection
    await playPage.selectPins([5]);
    await playPage.submitScore();

    // Test multiple pin selection
    await playPage.selectPins([1, 2, 3]);
    await playPage.submitScore();
  });

  test("Complete game flow should work", async ({ page }) => {
    const setupPage = new GameSetupPage(page);
    const playPage = new GamePlayPage(page);
    const resultsPage = new GameResultsPage(page);

    // Setup game
    await setupPage.navigateToSetup();
    await setupPage.selectGameMode("individual");
    await setupPage.addPlayer("Winner");
    await setupPage.addPlayer("Loser");
    await setupPage.startGame();

    await playPage.waitForGamePlayReady();

    // Play until someone wins
    // First player scores 50 to win (select pin 50, but since max is 12, we'll need multiple throws)
    await playPage.selectPins([12]); // Max single pin score
    await playPage.submitScore();

    // Wait for game to finish
    await playPage.assertGameFinished();

    // Verify results page
    await resultsPage.waitForResultsReady();

    const hasWinner = await resultsPage.hasWinner();
    expect(hasWinner).toBe(true);

    const winner = await resultsPage.getWinnerName();
    expect(winner).toBe("Winner");

    // Verify winner stats
    const stats = await resultsPage.getWinnerStats();
    expect(stats?.finalScore).toBe(50);

    // Verify leaderboard
    const standings = await resultsPage.getFinalStandings();
    expect(standings.length).toBeGreaterThan(0);
    expect(standings[0].name).toBe("Winner");
    expect(standings[0].position).toBe(1);
  });

  test("Page objects should handle errors gracefully", async ({ page }) => {
    const setupPage = new GameSetupPage(page);

    await setupPage.navigateToSetup();

    // Test with invalid operations
    const playersBeforeAdd = await setupPage.getPlayerList();

    // Try to start game without enough players
    const canStart = await setupPage.canStartGame();
    expect(canStart).toBe(false);

    // Add one player and verify still can't start
    await setupPage.addPlayer("Solo Player");
    const stillCantStart = await setupPage.canStartGame();
    expect(stillCantStart).toBe(false);

    // Verify validation message
    const validation = await setupPage.validateMinimumPlayers();
    expect(validation.isValid).toBe(false);
    expect(validation.message).toContain("more player");
  });
});
