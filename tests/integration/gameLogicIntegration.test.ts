/**
 * Integration tests for core game logic engine
 * Tests complete game scenarios and interactions between components
 *
 * @format
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine, ScoringType } from "../../src/utils/gameLogic";
import { createPlayer, createGame } from "../../src/utils/gameStateUtils";
import {
  validateScore,
  validateMinimumPlayers,
} from "../../src/utils/validation";
import type { Player, Game, GameState } from "../../src/utils/types";

describe("Game Logic Integration", () => {
  let players: Player[];
  let game: Game;

  beforeEach(() => {
    players = [
      createPlayer("Alice"),
      createPlayer("Bob"),
      createPlayer("Charlie"),
    ];
    game = createGame(players);
  });

  describe("Complete Game Scenarios", () => {
    it("should handle a complete game from start to finish", () => {
      // Validate minimum players
      const playerValidation = validateMinimumPlayers(players);
      expect(playerValidation.isValid).toBe(true);

      // Check initial game status
      let gameStatus = GameEngine.getGameStatus(players, "setup");
      expect(gameStatus.canStart).toBe(true);
      expect(gameStatus.playersReady).toBe(true);

      // Start game (transition to playing state)
      gameStatus = GameEngine.getGameStatus(players, "playing");
      expect(gameStatus.isActive).toBe(true);

      let currentPlayerIndex = 0;
      let gameState: GameState = "playing";
      let updatedPlayers = [...players];

      // Simulate several turns
      const turns = [
        { player: 0, score: 8, type: ScoringType.SINGLE_PIN },
        { player: 1, score: 5, type: ScoringType.MULTIPLE_PINS },
        { player: 2, score: 12, type: ScoringType.SINGLE_PIN },
        { player: 0, score: 7, type: ScoringType.SINGLE_PIN },
        { player: 1, score: 10, type: ScoringType.MULTIPLE_PINS },
        { player: 2, score: 6, type: ScoringType.SINGLE_PIN },
      ];

      for (const turn of turns) {
        expect(currentPlayerIndex).toBe(turn.player);

        // Validate the score
        const scoreValidation = validateScore(
          turn.score,
          turn.type === ScoringType.SINGLE_PIN
        );
        expect(scoreValidation.isValid).toBe(true);

        // Check if turn can be processed
        const canProcess = GameEngine.canProcessTurn(
          updatedPlayers,
          currentPlayerIndex,
          gameState
        );
        expect(canProcess).toBe(true);

        // Process the turn
        const turnResult = GameEngine.processTurn(
          updatedPlayers,
          currentPlayerIndex,
          turn.score,
          turn.type
        );

        updatedPlayers = turnResult.updatedPlayers;
        currentPlayerIndex = turnResult.nextPlayerIndex;

        if (turnResult.gameCompleted) {
          gameState = "finished";
          break;
        }
      }

      // Verify scores after turns
      expect(updatedPlayers[0].score).toBe(15); // 8 + 7
      expect(updatedPlayers[1].score).toBe(15); // 5 + 10
      expect(updatedPlayers[2].score).toBe(18); // 12 + 6

      // Continue playing until someone wins
      currentPlayerIndex = 0; // Alice's turn

      // Alice needs 35 more points to reach 50, let's do it in multiple turns
      // First, score 12 points (multiple pins)
      let turnResult = GameEngine.processTurn(
        updatedPlayers,
        currentPlayerIndex,
        12,
        ScoringType.MULTIPLE_PINS
      );
      updatedPlayers = turnResult.updatedPlayers;
      currentPlayerIndex = turnResult.nextPlayerIndex;

      // Now Alice has 27 points, continue with other players for a few turns
      // Bob's turn
      turnResult = GameEngine.processTurn(
        updatedPlayers,
        currentPlayerIndex,
        8,
        ScoringType.SINGLE_PIN
      );
      updatedPlayers = turnResult.updatedPlayers;
      currentPlayerIndex = turnResult.nextPlayerIndex;

      // Charlie's turn
      turnResult = GameEngine.processTurn(
        updatedPlayers,
        currentPlayerIndex,
        6,
        ScoringType.SINGLE_PIN
      );
      updatedPlayers = turnResult.updatedPlayers;
      currentPlayerIndex = turnResult.nextPlayerIndex;

      // Back to Alice's turn - she needs 23 more points to win
      // Score 12 more points
      turnResult = GameEngine.processTurn(
        updatedPlayers,
        currentPlayerIndex,
        12,
        ScoringType.MULTIPLE_PINS
      );
      updatedPlayers = turnResult.updatedPlayers;
      currentPlayerIndex = turnResult.nextPlayerIndex;

      // Continue until Alice can win
      // Skip other players' turns for brevity
      currentPlayerIndex = 0; // Back to Alice

      // Alice now has 39 points, needs 11 more to win
      const winningTurn = GameEngine.processTurn(
        updatedPlayers,
        currentPlayerIndex,
        11, // This will bring Alice to exactly 50
        ScoringType.SINGLE_PIN
      );

      expect(winningTurn.gameCompleted).toBe(true);
      expect(winningTurn.winner).not.toBeNull();
      expect(winningTurn.winner!.score).toBe(50);
      expect(winningTurn.winner!.name).toBe("Alice");

      // Complete the game
      const completedGame = GameEngine.completeGame(game, winningTurn.winner!);
      expect(completedGame.winner).toBe(winningTurn.winner);
      expect(completedGame.endTime).toBeInstanceOf(Date);

      // Verify final game status
      const finalStatus = GameEngine.getGameStatus(
        winningTurn.updatedPlayers,
        "finished"
      );
      expect(finalStatus.isActive).toBe(false);
      expect(finalStatus.winner).toBe(winningTurn.winner);
    });

    it("should handle score reset scenario correctly", () => {
      // Set up a player close to 50
      players[0].score = 45;
      let currentPlayerIndex = 0;

      // Player tries to score 8 points (would go to 53, should reset to 25)
      const turnResult = GameEngine.processTurn(
        players,
        currentPlayerIndex,
        8,
        ScoringType.SINGLE_PIN
      );

      expect(turnResult.updatedPlayers[0].score).toBe(25);
      expect(turnResult.gameCompleted).toBe(false);
      expect(turnResult.nextPlayerIndex).toBe(1);

      // Verify the player can continue playing
      const canContinue = GameEngine.canProcessTurn(
        turnResult.updatedPlayers,
        turnResult.nextPlayerIndex,
        "playing"
      );
      expect(canContinue).toBe(true);
    });

    it("should handle penalty scenarios correctly", () => {
      players[0].score = 40;
      players[0].penalties = 1;

      const penaltyResult = GameEngine.processPenaltyTurn(
        players,
        0,
        game,
        "Throwing violation"
      );

      // Verify penalty was applied
      expect(penaltyResult.turnResult.updatedPlayers[0].score).toBe(25);
      expect(penaltyResult.turnResult.updatedPlayers[0].penalties).toBe(2);
      expect(penaltyResult.penaltyRecord.reason).toBe("Throwing violation");
      expect(penaltyResult.updatedGame.penalties).toHaveLength(1);

      // Verify turn advances normally after penalty
      expect(penaltyResult.turnResult.nextPlayerIndex).toBe(1);
      expect(penaltyResult.turnResult.gameCompleted).toBe(false);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle multiple players reaching 50 in same round", () => {
      // This shouldn't happen in normal gameplay, but test the logic
      players[0].score = 50;
      players[1].score = 50;

      const winner = GameEngine.checkWinCondition(players);
      expect(winner).toBe(players[0]); // First player wins
    });

    it("should prevent turns when game is already won", () => {
      players[0].score = 50;

      const canProcess = GameEngine.canProcessTurn(players, 1, "playing");
      expect(canProcess).toBe(false);
    });

    it("should handle invalid scoring attempts", () => {
      expect(() => {
        GameEngine.processTurn(players, 0, 0, ScoringType.SINGLE_PIN);
      }).toThrow("Invalid score 0 for single_pin");

      expect(() => {
        GameEngine.processTurn(players, 0, 13, ScoringType.MULTIPLE_PINS);
      }).toThrow("Invalid score 13 for multiple_pins");
    });

    it("should handle invalid player indices", () => {
      expect(() => {
        GameEngine.processTurn(players, -1, 5, ScoringType.SINGLE_PIN);
      }).toThrow("Invalid player index");

      expect(() => {
        GameEngine.processTurn(players, 3, 5, ScoringType.SINGLE_PIN);
      }).toThrow("Invalid player index");
    });
  });

  describe("Player Statistics and Game Analysis", () => {
    it("should provide accurate player statistics throughout game", () => {
      players[0].score = 42;
      players[0].penalties = 1;

      const stats = GameEngine.getPlayerStats(players[0]);

      expect(stats.score).toBe(42);
      expect(stats.penalties).toBe(1);
      expect(stats.pointsToWin).toBe(8);
      expect(stats.canWinWith).toEqual([8]);
      expect(stats.riskScores).toEqual([9, 10, 11, 12]);
    });

    it("should calculate score effects accurately", () => {
      players[0].score = 47;

      // Test winning score
      const winEffect = GameEngine.calculateScoreEffect(players[0], 3);
      expect(winEffect.willWin).toBe(true);
      expect(winEffect.newScore).toBe(50);

      // Test reset score
      const resetEffect = GameEngine.calculateScoreEffect(players[0], 5);
      expect(resetEffect.willReset).toBe(true);
      expect(resetEffect.newScore).toBe(25);

      // Test normal score
      const normalEffect = GameEngine.calculateScoreEffect(players[0], 2);
      expect(normalEffect.willWin).toBe(false);
      expect(normalEffect.willReset).toBe(false);
      expect(normalEffect.newScore).toBe(49);
    });
  });

  describe("Game State Transitions", () => {
    it("should handle proper game state transitions", () => {
      // Setup -> Playing
      let status = GameEngine.getGameStatus(players, "setup");
      expect(status.canStart).toBe(true);

      // Playing -> Active game
      status = GameEngine.getGameStatus(players, "playing");
      expect(status.isActive).toBe(true);

      // Finish game
      players[0].score = 50;
      status = GameEngine.getGameStatus(players, "finished");
      expect(status.winner).toBe(players[0]);
      expect(status.isActive).toBe(false);
    });

    it("should prevent starting with insufficient players", () => {
      const singlePlayer = [createPlayer("Alone")];
      const status = GameEngine.getGameStatus(singlePlayer, "setup");

      expect(status.canStart).toBe(false);
      expect(status.playersReady).toBe(false);
    });
  });

  describe("Turn Management", () => {
    it("should handle turn rotation correctly", () => {
      let currentIndex = 0;

      // Process turns for each player
      for (let i = 0; i < 6; i++) {
        const turnResult = GameEngine.processTurn(
          players,
          currentIndex,
          5,
          ScoringType.SINGLE_PIN
        );

        expect(turnResult.gameCompleted).toBe(false);
        currentIndex = turnResult.nextPlayerIndex;
      }

      // After 6 turns (2 full rounds), should be back to player 0
      expect(currentIndex).toBe(0);
    });

    it("should stop turn rotation when game is won", () => {
      players[1].score = 45;

      const winningTurn = GameEngine.processTurn(
        players,
        1,
        5,
        ScoringType.SINGLE_PIN
      );

      expect(winningTurn.gameCompleted).toBe(true);
      expect(winningTurn.nextPlayerIndex).toBe(1); // Doesn't advance
      expect(winningTurn.winner!.score).toBe(50);
    });
  });
});
