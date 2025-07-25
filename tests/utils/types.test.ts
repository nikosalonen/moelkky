/**
 * Unit tests for type definitions and exports
 *
 * @format
 */

import { describe, it, expect } from "vitest";
import { ErrorType } from "../../src/utils/types";
import type {
  Player,
  Game,
  PenaltyRecord,
  GameState,
  AppState,
  ErrorHandler,
} from "../../src/utils/types";

describe("Type definitions", () => {
  it("should export Player interface correctly", () => {
    const player: Player = {
      id: "test-id",
      name: "Test Player",
      score: 25,
      penalties: 1,
      isActive: true,
    };

    expect(player.id).toBe("test-id");
    expect(player.name).toBe("Test Player");
    expect(player.score).toBe(25);
    expect(player.penalties).toBe(1);
    expect(player.isActive).toBe(true);
  });

  it("should export Game interface correctly", () => {
    const player: Player = {
      id: "player-1",
      name: "Player 1",
      score: 0,
      penalties: 0,
      isActive: false,
    };

    const penalty: PenaltyRecord = {
      playerId: "player-1",
      playerName: "Player 1",
      timestamp: new Date(),
      reason: "Test penalty",
    };

    const game: Game = {
      id: "game-1",
      players: [player],
      winner: null,
      startTime: new Date(),
      endTime: null,
      totalRounds: 0,
      penalties: [penalty],
    };

    expect(game.id).toBe("game-1");
    expect(game.players).toHaveLength(1);
    expect(game.winner).toBeNull();
    expect(game.startTime).toBeInstanceOf(Date);
    expect(game.endTime).toBeNull();
    expect(game.totalRounds).toBe(0);
    expect(game.penalties).toHaveLength(1);
  });

  it("should export PenaltyRecord interface correctly", () => {
    const penalty: PenaltyRecord = {
      playerId: "player-1",
      playerName: "John Doe",
      timestamp: new Date(),
      reason: "Throwing violation",
    };

    expect(penalty.playerId).toBe("player-1");
    expect(penalty.playerName).toBe("John Doe");
    expect(penalty.timestamp).toBeInstanceOf(Date);
    expect(penalty.reason).toBe("Throwing violation");
  });

  it("should export GameState type correctly", () => {
    const setupState: GameState = "setup";
    const playingState: GameState = "playing";
    const finishedState: GameState = "finished";

    expect(setupState).toBe("setup");
    expect(playingState).toBe("playing");
    expect(finishedState).toBe("finished");
  });

  it("should export AppState interface correctly", () => {
    const appState: AppState = {
      gameState: "setup",
      players: [],
      currentPlayerIndex: 0,
      gameHistory: [],
      currentGame: null,
    };

    expect(appState.gameState).toBe("setup");
    expect(appState.players).toEqual([]);
    expect(appState.currentPlayerIndex).toBe(0);
    expect(appState.gameHistory).toEqual([]);
    expect(appState.currentGame).toBeNull();
  });

  it("should export ErrorType enum correctly", () => {
    expect(ErrorType.DUPLICATE_PLAYER).toBe("duplicate_player");
    expect(ErrorType.INVALID_SCORE).toBe("invalid_score");
    expect(ErrorType.STORAGE_ERROR).toBe("storage_error");
    expect(ErrorType.GAME_STATE_ERROR).toBe("game_state_error");
  });

  it("should export ErrorHandler interface correctly", () => {
    const errorHandler: ErrorHandler = {
      showError: (type: ErrorType, message: string) => {
        // Mock implementation
        console.log(`Error ${type}: ${message}`);
      },
      clearError: () => {
        // Mock implementation
        console.log("Error cleared");
      },
    };

    expect(typeof errorHandler.showError).toBe("function");
    expect(typeof errorHandler.clearError).toBe("function");
  });
});
