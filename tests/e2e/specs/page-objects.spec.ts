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

  test("Complete game flow should work with elimination win", async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for this test
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
    // Continue throwing until either:
    // 1. Winner reaches 50 points, OR
    // 2. Loser gets eliminated (3 consecutive misses)
    let attempts = 0;
    const maxAttempts = 30; // Prevent infinite loop

    while (attempts < maxAttempts) {
      const currentPlayer = await playPage.getCurrentPlayerName();
      const currentScore = await playPage.getCurrentPlayerScore();
      
      console.log(`Attempt ${attempts + 1}: ${currentPlayer}'s turn, score: ${currentScore}`);
      
      if (currentPlayer === "Winner") {
        await playPage.selectPins([10]); // Single pin 10 = 10 points
        await playPage.submitScore();
        
        // Wait for score to be processed
        await page.waitForTimeout(1000);
        
        // Check if Winner has reached 50 points
        const newScore = await playPage.getCurrentPlayerScore();
        console.log(`Winner's new score: ${newScore}`);
        
        if (newScore >= 50) {
          console.log("Winner reached 50 points!");
          break;
        }
      } else {
        // Loser's turn - submit a miss (this could lead to elimination)
        await playPage.submitMiss();
        await page.waitForTimeout(1000);
      }
      
      attempts++;
      
      // Check if game is finished (either by reaching 50 or elimination)
      try {
        const isFinished = await playPage.isGameFinished();
        if (isFinished) {
          console.log("Game finished!");
          break;
        }
      } catch {
        // Game not finished yet, continue
      }
    }

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
    // Winner might not have exactly 50 points if opponent was eliminated
    expect(stats?.finalScore).toBeGreaterThan(0);
    expect(stats?.finalScore).toBeLessThanOrEqual(50);

    // Verify leaderboard
    const standings = await resultsPage.getFinalStandings();
    expect(standings.length).toBeGreaterThan(0);
    expect(standings[0].name).toBe("Winner");
    expect(standings[0].position).toBe(1);
  });

  test("Complete game flow should work with 50-point win", async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for this test
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

    // Play until Winner reaches exactly 50 points
    // Use a strategy that ensures Winner gets to 50 without elimination
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loop

    while (attempts < maxAttempts) {
      const currentPlayer = await playPage.getCurrentPlayerName();
      const currentScore = await playPage.getCurrentPlayerScore();
      
      console.log(`Attempt ${attempts + 1}: ${currentPlayer}'s turn, score: ${currentScore}`);
      
      if (currentPlayer === "Winner") {
        // Calculate how many points Winner needs to reach exactly 50
        const pointsNeeded = 50 - currentScore;
        
        if (pointsNeeded <= 0) {
          console.log("Winner already has 50+ points!");
          break;
        }
        
        // Choose pins strategically to reach exactly 50
        let pinsToSelect: number[];
        if (pointsNeeded <= 12) {
          // Single pin to reach exactly 50
          pinsToSelect = [pointsNeeded];
        } else {
          // Use multiple pins to get closer to 50
          pinsToSelect = [10]; // Single pin 10 = 10 points
        }
        
        await playPage.selectPins(pinsToSelect);
        await playPage.submitScore();
        
        // Wait for score to be processed
        await page.waitForTimeout(1000);
        
        // Check if game finished before trying to get score
        try {
          const isFinished = await playPage.isGameFinished();
          if (isFinished) {
            console.log("Game finished during Winner's turn!");
            break;
          }
        } catch {
          // Game not finished yet, continue
        }
        
        // Check if Winner has reached 50 points
        try {
          const newScore = await playPage.getCurrentPlayerScore();
          console.log(`Winner's new score: ${newScore}`);
          
          if (newScore >= 50) {
            console.log("Winner reached 50 points!");
            break;
          }
        } catch (error) {
          console.log("Could not get current score, game might have finished");
          // Check if game is finished
          try {
            const isFinished = await playPage.isGameFinished();
            if (isFinished) {
              console.log("Game finished!");
              break;
            }
          } catch {
            // Continue with next attempt
          }
        }
      } else {
        // Loser's turn - score some points to avoid elimination
        // This ensures the game doesn't end by elimination
        await playPage.selectPins([5]); // Single pin 5 = 5 points
        await playPage.submitScore();
        await page.waitForTimeout(1000);
        
        // Check if game finished after Loser's turn
        try {
          const isFinished = await playPage.isGameFinished();
          if (isFinished) {
            console.log("Game finished during Loser's turn!");
            break;
          }
        } catch {
          // Game not finished yet, continue
        }
      }
      
      attempts++;
      
      // Check if game is finished
      try {
        const isFinished = await playPage.isGameFinished();
        if (isFinished) {
          console.log("Game finished!");
          break;
        }
      } catch {
        // Game not finished yet, continue
      }
    }

    // Wait for game to finish
    await playPage.assertGameFinished();

    // Verify results page
    await resultsPage.waitForResultsReady();

    const hasWinner = await resultsPage.hasWinner();
    expect(hasWinner).toBe(true);

    const winner = await resultsPage.getWinnerName();
    expect(winner).toBe("Winner");

    // Verify winner stats - should have exactly 50 points
    const stats = await resultsPage.getWinnerStats();
    expect(stats?.finalScore).toBe(50);

    // Verify leaderboard
    const standings = await resultsPage.getFinalStandings();
    expect(standings.length).toBeGreaterThan(0);
    expect(standings[0].name).toBe("Winner");
    expect(standings[0].position).toBe(1);
  });

  test("Game flow should work with multiple players (individual mode)", async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for this test
    const setupPage = new GameSetupPage(page);
    const playPage = new GamePlayPage(page);
    const resultsPage = new GameResultsPage(page);

    // Setup game with 4 players
    await setupPage.navigateToSetup();
    await setupPage.selectGameMode("individual");
    await setupPage.addPlayer("Player 1");
    await setupPage.addPlayer("Player 2");
    await setupPage.addPlayer("Player 3");
    await setupPage.addPlayer("Player 4");
    await setupPage.startGame();

    await playPage.waitForGamePlayReady();

    // Verify all players are in the game
    const allScores = await playPage.getAllPlayerScores();
    expect(allScores.length).toBe(4);
    expect(allScores.map(p => p.name)).toEqual(["Player 1", "Player 2", "Player 3", "Player 4"]);

    // Play a few rounds to test turn progression
    for (let round = 0; round < 3; round++) {
      for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
        const currentPlayer = await playPage.getCurrentPlayerName();
        console.log(`Round ${round + 1}, Player: ${currentPlayer}`);
        
        // Each player scores some points
        await playPage.selectPins([5]); // Single pin 5 = 5 points
        await playPage.submitScore();
        
        // Wait for turn to advance
        await page.waitForTimeout(1000);
        
        // Check if game finished (someone might have won)
        try {
          const isFinished = await playPage.isGameFinished();
          if (isFinished) {
            console.log("Game finished during multi-player test!");
            break;
          }
        } catch {
          // Game not finished yet, continue
        }
      }
    }

    // Verify the game progressed (at least one player should have scored)
    const finalScores = await playPage.getAllPlayerScores();
    const totalScore = finalScores.reduce((sum, player) => sum + player.score, 0);
    expect(totalScore).toBeGreaterThan(0);
  });

  test("Game flow should work with multiple teams (team mode)", async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for this test
    const setupPage = new GameSetupPage(page);
    const playPage = new GamePlayPage(page);
    const resultsPage = new GameResultsPage(page);

    // Setup game with 3 teams
    await setupPage.navigateToSetup();
    await setupPage.selectGameMode("team");
    
    // Add 6 players (2 per team)
    await setupPage.addPlayer("Player A1");
    await setupPage.addPlayer("Player A2");
    await setupPage.addPlayer("Player B1");
    await setupPage.addPlayer("Player B2");
    await setupPage.addPlayer("Player C1");
    await setupPage.addPlayer("Player C2");
    
    // Create 3 teams
    await setupPage.createTeam("Team Alpha", ["Player A1", "Player A2"]);
    await setupPage.createTeam("Team Beta", ["Player B1", "Player B2"]);
    await setupPage.createTeam("Team Gamma", ["Player C1", "Player C2"]);
    
    await setupPage.startGame();

    await playPage.waitForGamePlayReady();

    // Verify all teams are in the game
    const allScores = await playPage.getAllPlayerScores();
    expect(allScores.length).toBe(6); // 6 players across 3 teams

    // Play a few rounds to test team turn progression
    for (let round = 0; round < 2; round++) {
      for (let teamIndex = 0; teamIndex < 3; teamIndex++) {
        const currentPlayer = await playPage.getCurrentPlayerName();
        console.log(`Round ${round + 1}, Player: ${currentPlayer}`);
        
        // Each player scores some points
        await playPage.selectPins([5]); // Single pin 5 = 5 points
        await playPage.submitScore();
        
        // Wait for turn to advance
        await page.waitForTimeout(1000);
        
        // Check if game finished (a team might have won)
        try {
          const isFinished = await playPage.isGameFinished();
          if (isFinished) {
            console.log("Game finished during multi-team test!");
            break;
          }
        } catch {
          // Game not finished yet, continue
        }
      }
    }

    // Verify the game progressed (at least one team should have scored)
    const finalScores = await playPage.getAllPlayerScores();
    const totalScore = finalScores.reduce((sum, player) => sum + player.score, 0);
    expect(totalScore).toBeGreaterThan(0);
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
