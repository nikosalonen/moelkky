/**
 * Unit tests for game state utility functions
 *
 * @format
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createPlayer,
  createGame,
  createPenaltyRecord,
  applyScore,
  applyPenalty,
  hasPlayerWon,
  getNextPlayerIndex,
  getPointsNeeded,
  resetPlayersForNewGame,
  findWinner,
  isValidStateTransition,
  completeGame,
} from "../../src/utils/gameStateUtils";
import type { Player, Game } from "../../src/utils/types";

describe("createPlayer", () => {
  it("should create a player with correct default values", () => {
    const player = createPlayer("John Doe");

    expect(player.name).toBe("John Doe");
    expect(player.score).toBe(0);
    expect(player.penalties).toBe(0);
    expect(player.isActive).toBe(false);
    expect(player.id).toBeDefined();
    expect(typeof player.id).toBe("string");
  });

  it("should trim whitespace from player name", () => {
    const player = createPlayer("  Alice  ");
    expect(player.name).toBe("Alice");
  });

  it("should generate unique IDs for different players", () => {
    const player1 = createPlayer("Player 1");
    const player2 = createPlayer("Player 2");

    expect(player1.id).not.toBe(player2.id);
  });
});

describe("createGame", () => {
  let players: Player[];

  beforeEach(() => {
    players = [createPlayer("John"), createPlayer("Jane")];
  });

  it("should create a game with correct initial values", () => {
    const game = createGame(players);

    expect(game.players).toHaveLength(2);
    expect(game.winner).toBeNull();
    expect(game.startTime).toBeInstanceOf(Date);
    expect(game.endTime).toBeNull();
    expect(game.totalRounds).toBe(0);
    expect(game.penalties).toEqual([]);
    expect(game.id).toBeDefined();
  });

  it("should reset player scores and penalties in the game", () => {
    players[0].score = 25;
    players[0].penalties = 2;

    const game = createGame(players);

    expect(game.players[0].score).toBe(0);
    expect(game.players[0].penalties).toBe(0);
  });

  it("should not modify original player objects", () => {
    players[0].score = 25;
    const originalScore = players[0].score;

    createGame(players);

    expect(players[0].score).toBe(originalScore);
  });
});

describe("createPenaltyRecord", () => {
  it("should create a penalty record with correct values", () => {
    const penalty = createPenaltyRecord(
      "player1",
      "John",
      "Throwing violation"
    );

    expect(penalty.playerId).toBe("player1");
    expect(penalty.playerName).toBe("John");
    expect(penalty.reason).toBe("Throwing violation");
    expect(penalty.timestamp).toBeInstanceOf(Date);
  });

  it("should use default reason when not provided", () => {
    const penalty = createPenaltyRecord("player1", "John");
    expect(penalty.reason).toBe("Rule violation");
  });
});

describe("applyScore", () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayer("Test Player");
  });

  it("should add score normally when under 50", () => {
    player.score = 20;
    const updatedPlayer = applyScore(player, 15);

    expect(updatedPlayer.score).toBe(35);
  });

  it("should keep score at 50 when exactly 50", () => {
    player.score = 45;
    const updatedPlayer = applyScore(player, 5);

    expect(updatedPlayer.score).toBe(50);
  });

  it("should reset to 25 when score exceeds 50", () => {
    player.score = 45;
    const updatedPlayer = applyScore(player, 10);

    expect(updatedPlayer.score).toBe(25);
  });

  it("should reset to 25 when score greatly exceeds 50", () => {
    player.score = 30;
    const updatedPlayer = applyScore(player, 25);

    expect(updatedPlayer.score).toBe(25);
  });

  it("should not modify original player object", () => {
    player.score = 20;
    const originalScore = player.score;

    applyScore(player, 15);

    expect(player.score).toBe(originalScore);
  });
});

describe("applyScore edge cases", () => {
  let player: Player;
  beforeEach(() => {
    player = createPlayer("Edge Player");
  });

  it("should reset to 25 when player is at 49 and scores 2", () => {
    player.score = 49;
    const updatedPlayer = applyScore(player, 2);
    expect(updatedPlayer.score).toBe(25);
  });

  it("should reset to 25 when player is at 48 and scores 2", () => {
    player.score = 48;
    const updatedPlayer = applyScore(player, 2);
    expect(updatedPlayer.score).toBe(25);
  });

  it("should remain 50 when player is at 50 and scores 0", () => {
    player.score = 50;
    const updatedPlayer = applyScore(player, 0);
    expect(updatedPlayer.score).toBe(50);
    expect(hasPlayerWon(updatedPlayer)).toBe(true);
  });
});

describe("applyPenalty", () => {
  it("should reset score to 25 and increment penalty count", () => {
    const player = createPlayer("Test Player");
    player.score = 40;
    player.penalties = 1;

    const penalizedPlayer = applyPenalty(player);

    expect(penalizedPlayer.score).toBe(25);
    expect(penalizedPlayer.penalties).toBe(2);
  });

  it("should not modify original player object", () => {
    const player = createPlayer("Test Player");
    player.score = 40;
    const originalScore = player.score;
    const originalPenalties = player.penalties;

    applyPenalty(player);

    expect(player.score).toBe(originalScore);
    expect(player.penalties).toBe(originalPenalties);
  });
});

describe("hasPlayerWon", () => {
  it("should return true when player score is exactly 50", () => {
    const player = createPlayer("Winner");
    player.score = 50;

    expect(hasPlayerWon(player)).toBe(true);
  });

  it("should return false when player score is less than 50", () => {
    const player = createPlayer("Not Winner");
    player.score = 49;

    expect(hasPlayerWon(player)).toBe(false);
  });

  it("should return false when player score is 0", () => {
    const player = createPlayer("New Player");

    expect(hasPlayerWon(player)).toBe(false);
  });
});

describe("getNextPlayerIndex", () => {
  it("should return next index in sequence", () => {
    expect(getNextPlayerIndex(0, 3)).toBe(1);
    expect(getNextPlayerIndex(1, 3)).toBe(2);
  });

  it("should wrap around to 0 when at last player", () => {
    expect(getNextPlayerIndex(2, 3)).toBe(0);
  });

  it("should work with 2 players", () => {
    expect(getNextPlayerIndex(0, 2)).toBe(1);
    expect(getNextPlayerIndex(1, 2)).toBe(0);
  });
});

describe("getPointsNeeded", () => {
  it("should calculate points needed correctly", () => {
    const player = createPlayer("Test Player");

    player.score = 30;
    expect(getPointsNeeded(player)).toBe(20);

    player.score = 45;
    expect(getPointsNeeded(player)).toBe(5);

    player.score = 0;
    expect(getPointsNeeded(player)).toBe(50);
  });

  it("should return 0 when player has won", () => {
    const player = createPlayer("Winner");
    player.score = 50;

    expect(getPointsNeeded(player)).toBe(0);
  });

  it("should return 0 when player score exceeds 50 (edge case)", () => {
    const player = createPlayer("Over 50");
    player.score = 60; // This shouldn't happen in normal gameplay

    expect(getPointsNeeded(player)).toBe(0);
  });
});

describe("resetPlayersForNewGame", () => {
  it("should reset all player scores and penalties", () => {
    const players = [
      { ...createPlayer("Player 1"), score: 30, penalties: 2, isActive: true },
      { ...createPlayer("Player 2"), score: 45, penalties: 1, isActive: false },
    ];

    const resetPlayers = resetPlayersForNewGame(players);

    resetPlayers.forEach((player) => {
      expect(player.score).toBe(0);
      expect(player.penalties).toBe(0);
      expect(player.isActive).toBe(false);
    });
  });

  it("should preserve player names and IDs", () => {
    const players = [
      { ...createPlayer("Player 1"), score: 30 },
      { ...createPlayer("Player 2"), score: 45 },
    ];

    const resetPlayers = resetPlayersForNewGame(players);

    expect(resetPlayers[0].name).toBe("Player 1");
    expect(resetPlayers[1].name).toBe("Player 2");
    expect(resetPlayers[0].id).toBe(players[0].id);
    expect(resetPlayers[1].id).toBe(players[1].id);
  });

  it("should not modify original player objects", () => {
    const players = [{ ...createPlayer("Player 1"), score: 30, penalties: 2 }];
    const originalScore = players[0].score;
    const originalPenalties = players[0].penalties;

    resetPlayersForNewGame(players);

    expect(players[0].score).toBe(originalScore);
    expect(players[0].penalties).toBe(originalPenalties);
  });
});

describe("findWinner", () => {
  it("should find the winner when a player has score 50", () => {
    const players = [
      { ...createPlayer("Player 1"), score: 30 },
      { ...createPlayer("Winner"), score: 50 },
      { ...createPlayer("Player 3"), score: 25 },
    ];

    const winner = findWinner(players);

    expect(winner).not.toBeNull();
    expect(winner!.name).toBe("Winner");
    expect(winner!.score).toBe(50);
  });

  it("should return null when no player has won", () => {
    const players = [
      { ...createPlayer("Player 1"), score: 30 },
      { ...createPlayer("Player 2"), score: 45 },
      { ...createPlayer("Player 3"), score: 25 },
    ];

    const winner = findWinner(players);

    expect(winner).toBeNull();
  });

  it("should return the first winner if multiple players have score 50", () => {
    const players = [
      { ...createPlayer("First Winner"), score: 50 },
      { ...createPlayer("Second Winner"), score: 50 },
    ];

    const winner = findWinner(players);

    expect(winner!.name).toBe("First Winner");
  });
});

describe("isValidStateTransition", () => {
  it("should allow valid state transitions", () => {
    expect(isValidStateTransition("setup", "playing")).toBe(true);
    expect(isValidStateTransition("playing", "finished")).toBe(true);
    expect(isValidStateTransition("finished", "setup")).toBe(true);
  });

  it("should reject invalid state transitions", () => {
    expect(isValidStateTransition("setup", "finished")).toBe(false);
    expect(isValidStateTransition("playing", "setup")).toBe(false);
    expect(isValidStateTransition("finished", "playing")).toBe(false);
  });

  it("should reject staying in the same state", () => {
    expect(isValidStateTransition("setup", "setup")).toBe(false);
    expect(isValidStateTransition("playing", "playing")).toBe(false);
    expect(isValidStateTransition("finished", "finished")).toBe(false);
  });
});

describe("completeGame", () => {
  it("should set winner and end time", () => {
    const players = [createPlayer("Winner"), createPlayer("Loser")];
    const game = createGame(players);
    const winner = players[0];

    const completedGame = completeGame(game, winner);

    expect(completedGame.winner).toBe(winner);
    expect(completedGame.endTime).toBeInstanceOf(Date);
    expect(completedGame.endTime!.getTime()).toBeGreaterThanOrEqual(
      game.startTime.getTime()
    );
  });

  it("should not modify original game object", () => {
    const players = [createPlayer("Winner"), createPlayer("Loser")];
    const game = createGame(players);
    const winner = players[0];
    const originalEndTime = game.endTime;
    const originalWinner = game.winner;

    completeGame(game, winner);

    expect(game.endTime).toBe(originalEndTime);
    expect(game.winner).toBe(originalWinner);
  });
});
