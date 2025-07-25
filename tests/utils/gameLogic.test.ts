/**
 * Unit tests for core game logic engine
 *
 * @format
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  GameEngine,
  ScoringType,
  type ScoreResult,
  type TurnResult,
} from "../../src/utils/gameLogic";
import { createPlayer, createGame } from "../../src/utils/gameStateUtils";
import type { Player, Game } from "../../src/utils/types";

describe("GameEngine", () => {
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

  describe("applyPlayerScore", () => {
    it("should apply single pin score correctly", () => {
      const player = { ...createPlayer("Test"), score: 20 };
      const result = GameEngine.applyPlayerScore(
        player,
        5,
        ScoringType.SINGLE_PIN
      );

      expect(result.updatedPlayer.score).toBe(25);
      expect(result.gameWon).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.scoreReset).toBe(false);
    });

    it("should apply multiple pin score correctly", () => {
      const player = { ...createPlayer("Test"), score: 30 };
      const result = GameEngine.applyPlayerScore(
        player,
        8,
        ScoringType.MULTIPLE_PINS
      );

      expect(result.updatedPlayer.score).toBe(38);
      expect(result.gameWon).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.scoreReset).toBe(false);
    });

    it("should detect win when player reaches exactly 50", () => {
      const player = { ...createPlayer("Winner"), score: 45 };
      const result = GameEngine.applyPlayerScore(
        player,
        5,
        ScoringType.SINGLE_PIN
      );

      expect(result.updatedPlayer.score).toBe(50);
      expect(result.gameWon).toBe(true);
      expect(result.winner).toBe(result.updatedPlayer);
      expect(result.scoreReset).toBe(false);
    });

    it("should reset score to 25 when exceeding 50", () => {
      const player = { ...createPlayer("Overshot"), score: 45 };
      const result = GameEngine.applyPlayerScore(
        player,
        8,
        ScoringType.SINGLE_PIN
      );

      expect(result.updatedPlayer.score).toBe(25);
      expect(result.gameWon).toBe(false);
      expect(result.winner).toBeNull();
      expect(result.scoreReset).toBe(true);
    });

    it("should throw error for invalid single pin score", () => {
      const player = createPlayer("Test");

      expect(() => {
        GameEngine.applyPlayerScore(player, 13, ScoringType.SINGLE_PIN);
      }).toThrow("Invalid score 13 for single_pin");
    });

    it("should accept zero score for missed throw", () => {
      const player = createPlayer("Test");
      
      expect(() => {
        GameEngine.applyPlayerScore(player, 0, ScoringType.SINGLE_PIN);
      }).not.toThrow();
    });

    it("should throw error for invalid multiple pin score", () => {
      const player = createPlayer("Test");

      expect(() => {
        GameEngine.applyPlayerScore(player, 1, ScoringType.MULTIPLE_PINS);
      }).toThrow("Invalid score 1 for multiple_pins");

      expect(() => {
        GameEngine.applyPlayerScore(player, 13, ScoringType.MULTIPLE_PINS);
      }).toThrow("Invalid score 13 for multiple_pins");
    });
  });

  describe("applyPlayerPenalty", () => {
    it("should reset player score to 25 and increment penalties", () => {
      const player = { ...createPlayer("Penalized"), score: 40, penalties: 1 };
      const result = GameEngine.applyPlayerPenalty(
        player,
        "Throwing violation"
      );

      expect(result.score).toBe(25);
      expect(result.penalties).toBe(2);
    });

    it("should use default reason when not provided", () => {
      const player = { ...createPlayer("Penalized"), score: 30 };
      const result = GameEngine.applyPlayerPenalty(player);

      expect(result.score).toBe(25);
      expect(result.penalties).toBe(1);
    });
  });

  describe("processTurn", () => {
    beforeEach(() => {
      players[0].score = 20;
      players[1].score = 35;
      players[2].score = 10;
    });

    it("should process a normal turn correctly", () => {
      const result = GameEngine.processTurn(
        players,
        0,
        5,
        ScoringType.SINGLE_PIN
      );

      expect(result.updatedPlayers[0].score).toBe(25);
      expect(result.nextPlayerIndex).toBe(1);
      expect(result.gameCompleted).toBe(false);
      expect(result.winner).toBeNull();
    });

    it("should complete game when player wins", () => {
      players[0].score = 45;
      const result = GameEngine.processTurn(
        players,
        0,
        5,
        ScoringType.SINGLE_PIN
      );

      expect(result.updatedPlayers[0].score).toBe(50);
      expect(result.nextPlayerIndex).toBe(0); // Don't advance when game ends
      expect(result.gameCompleted).toBe(true);
      expect(result.winner).toBe(result.updatedPlayers[0]);
    });

    it("should wrap around to first player after last player", () => {
      const result = GameEngine.processTurn(
        players,
        2,
        3,
        ScoringType.SINGLE_PIN
      );

      expect(result.nextPlayerIndex).toBe(0);
      expect(result.gameCompleted).toBe(false);
    });

    it("should throw error for invalid player index", () => {
      expect(() => {
        GameEngine.processTurn(players, -1, 5, ScoringType.SINGLE_PIN);
      }).toThrow("Invalid player index");

      expect(() => {
        GameEngine.processTurn(players, 3, 5, ScoringType.SINGLE_PIN);
      }).toThrow("Invalid player index");
    });
  });

  describe("processPenaltyTurn", () => {
    beforeEach(() => {
      players[0].score = 40;
      players[0].penalties = 1;
    });

    it("should process penalty turn correctly", () => {
      const result = GameEngine.processPenaltyTurn(
        players,
        0,
        game,
        "Throwing violation"
      );

      expect(result.turnResult.updatedPlayers[0].score).toBe(25);
      expect(result.turnResult.updatedPlayers[0].penalties).toBe(2);
      expect(result.turnResult.nextPlayerIndex).toBe(1);
      expect(result.turnResult.gameCompleted).toBe(false);
      expect(result.penaltyRecord.playerId).toBe(players[0].id);
      expect(result.penaltyRecord.reason).toBe("Throwing violation");
      expect(result.updatedGame.penalties).toHaveLength(1);
    });

    it("should use default penalty reason", () => {
      const result = GameEngine.processPenaltyTurn(players, 0, game);

      expect(result.penaltyRecord.reason).toBe("Rule violation");
    });

    it("should throw error for invalid player index", () => {
      expect(() => {
        GameEngine.processPenaltyTurn(players, -1, game);
      }).toThrow("Invalid player index");
    });
  });

  describe("checkWinCondition", () => {
    it("should return winner when player has exactly 50 points", () => {
      players[1].score = 50;
      const winner = GameEngine.checkWinCondition(players);

      expect(winner).toBe(players[1]);
    });

    it("should return null when no player has won", () => {
      players[0].score = 45;
      players[1].score = 30;
      players[2].score = 25;
      const winner = GameEngine.checkWinCondition(players);

      expect(winner).toBeNull();
    });

    it("should return first winner if multiple players have 50", () => {
      players[0].score = 50;
      players[1].score = 50;
      const winner = GameEngine.checkWinCondition(players);

      expect(winner).toBe(players[0]);
    });
  });

  describe("completeGame", () => {
    it("should complete game with winner and end time", () => {
      const winner = players[0];
      const completedGame = GameEngine.completeGame(game, winner);

      expect(completedGame.winner).toBe(winner);
      expect(completedGame.endTime).toBeInstanceOf(Date);
      expect(completedGame.endTime!.getTime()).toBeGreaterThanOrEqual(
        game.startTime.getTime()
      );
    });
  });

  describe("isValidScore", () => {
    it("should validate single pin scores correctly", () => {
      expect(GameEngine.isValidScore(0, ScoringType.SINGLE_PIN)).toBe(true);
      expect(GameEngine.isValidScore(1, ScoringType.SINGLE_PIN)).toBe(true);
      expect(GameEngine.isValidScore(12, ScoringType.SINGLE_PIN)).toBe(true);
      expect(GameEngine.isValidScore(13, ScoringType.SINGLE_PIN)).toBe(false);
      expect(GameEngine.isValidScore(5.5, ScoringType.SINGLE_PIN)).toBe(false);
    });

    it("should validate multiple pin scores correctly", () => {
      expect(GameEngine.isValidScore(2, ScoringType.MULTIPLE_PINS)).toBe(true);
      expect(GameEngine.isValidScore(12, ScoringType.MULTIPLE_PINS)).toBe(true);
      expect(GameEngine.isValidScore(1, ScoringType.MULTIPLE_PINS)).toBe(false);
      expect(GameEngine.isValidScore(13, ScoringType.MULTIPLE_PINS)).toBe(
        false
      );
      expect(GameEngine.isValidScore(3.7, ScoringType.MULTIPLE_PINS)).toBe(
        false
      );
    });
  });

  describe("calculateScoreEffect", () => {
    it("should calculate normal score effect", () => {
      const player = { ...createPlayer("Test"), score: 30 };
      const effect = GameEngine.calculateScoreEffect(player, 10);

      expect(effect.newScore).toBe(40);
      expect(effect.willWin).toBe(false);
      expect(effect.willReset).toBe(false);
      expect(effect.pointsToWin).toBe(20);
    });

    it("should calculate winning score effect", () => {
      const player = { ...createPlayer("Test"), score: 45 };
      const effect = GameEngine.calculateScoreEffect(player, 5);

      expect(effect.newScore).toBe(50);
      expect(effect.willWin).toBe(true);
      expect(effect.willReset).toBe(false);
      expect(effect.pointsToWin).toBe(5);
    });

    it("should calculate reset score effect", () => {
      const player = { ...createPlayer("Test"), score: 45 };
      const effect = GameEngine.calculateScoreEffect(player, 8);

      expect(effect.newScore).toBe(25);
      expect(effect.willWin).toBe(false);
      expect(effect.willReset).toBe(true);
      expect(effect.pointsToWin).toBe(5);
    });
  });

  describe("getGameStatus", () => {
    it("should return correct status for setup state", () => {
      const status = GameEngine.getGameStatus(players, "setup");

      expect(status.isActive).toBe(false);
      expect(status.winner).toBeNull();
      expect(status.canStart).toBe(true);
      expect(status.playersReady).toBe(true);
    });

    it("should return correct status for playing state", () => {
      const status = GameEngine.getGameStatus(players, "playing");

      expect(status.isActive).toBe(true);
      expect(status.winner).toBeNull();
      expect(status.canStart).toBe(false);
      expect(status.playersReady).toBe(true);
    });

    it("should return correct status for finished state", () => {
      players[0].score = 50;
      const status = GameEngine.getGameStatus(players, "finished");

      expect(status.isActive).toBe(false);
      expect(status.winner).toBe(players[0]);
      expect(status.canStart).toBe(false);
      expect(status.playersReady).toBe(true);
    });

    it("should indicate not ready with insufficient players", () => {
      const singlePlayer = [createPlayer("Alone")];
      const status = GameEngine.getGameStatus(singlePlayer, "setup");

      expect(status.playersReady).toBe(false);
      expect(status.canStart).toBe(false);
    });
  });

  describe("canProcessTurn", () => {
    it("should allow turn processing during active game", () => {
      const canProcess = GameEngine.canProcessTurn(players, 0, "playing");
      expect(canProcess).toBe(true);
    });

    it("should not allow turn processing in setup state", () => {
      const canProcess = GameEngine.canProcessTurn(players, 0, "setup");
      expect(canProcess).toBe(false);
    });

    it("should not allow turn processing in finished state", () => {
      const canProcess = GameEngine.canProcessTurn(players, 0, "finished");
      expect(canProcess).toBe(false);
    });

    it("should not allow turn processing with invalid player index", () => {
      expect(GameEngine.canProcessTurn(players, -1, "playing")).toBe(false);
      expect(GameEngine.canProcessTurn(players, 3, "playing")).toBe(false);
    });

    it("should not allow turn processing when game is already won", () => {
      players[0].score = 50;
      const canProcess = GameEngine.canProcessTurn(players, 1, "playing");
      expect(canProcess).toBe(false);
    });
  });

  describe("getPlayerStats", () => {
    it("should calculate player stats correctly", () => {
      const player = { ...createPlayer("Test"), score: 42, penalties: 2 };
      const stats = GameEngine.getPlayerStats(player);

      expect(stats.score).toBe(42);
      expect(stats.penalties).toBe(2);
      expect(stats.pointsToWin).toBe(8);
      expect(stats.canWinWith).toEqual([8]);
      expect(stats.riskScores).toEqual([9, 10, 11, 12]);
    });

    it("should handle player at score 0", () => {
      const player = createPlayer("New");
      const stats = GameEngine.getPlayerStats(player);

      expect(stats.pointsToWin).toBe(50);
      expect(stats.canWinWith).toEqual([]);
      expect(stats.riskScores).toEqual([]);
    });

    it("should handle player close to winning", () => {
      const player = { ...createPlayer("Close"), score: 48 };
      const stats = GameEngine.getPlayerStats(player);

      expect(stats.pointsToWin).toBe(2);
      expect(stats.canWinWith).toEqual([2]);
      expect(stats.riskScores).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it("should handle winning player", () => {
      const player = { ...createPlayer("Winner"), score: 50 };
      const stats = GameEngine.getPlayerStats(player);

      expect(stats.pointsToWin).toBe(0);
      expect(stats.canWinWith).toEqual([]);
      expect(stats.riskScores).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
  });
});
