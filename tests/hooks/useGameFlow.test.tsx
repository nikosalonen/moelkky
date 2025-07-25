/**
 * Tests for useGameFlow hook
 *
 * @format
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import type { ComponentChildren } from "preact";
import { GameProvider } from "../../src/context/GameContext";
import { useGameFlow } from "../../src/hooks/useGameFlow";
import { usePlayerManagement } from "../../src/hooks/usePlayerManagement";

// Mock session storage
vi.mock("../../src/utils/storage/sessionStorage", () => ({
  sessionStorageUtil: {
    loadAppState: vi.fn(() => null),
    saveAppState: vi.fn(),
    saveCurrentGame: vi.fn(),
    saveGameHistory: vi.fn(),
  },
}));

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: ComponentChildren }) => (
  <GameProvider>{children}</GameProvider>
);

describe("useGameFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial game state", () => {
    const { result } = renderHook(() => useGameFlow(), { wrapper });

    expect(result.current.gameState).toBe("setup");
    expect(result.current.currentPlayer).toBeNull();
    expect(result.current.currentPlayerIndex).toBe(0);
    expect(result.current.canStartGame).toBe(false);
    expect(result.current.winner).toBeNull();
  });

  it("should not allow starting game with insufficient players", () => {
    const { result } = renderHook(() => useGameFlow(), { wrapper });

    act(() => {
      const response = result.current.startGame();
      expect(response.success).toBe(false);
      expect(response.error).toContain("Need at least 2 players");
    });

    expect(result.current.gameState).toBe("setup");
  });

  it("should start game with sufficient players", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Add two players
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    expect(result.current.game.canStartGame).toBe(true);

    act(() => {
      const response = result.current.game.startGame();
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.game.gameState).toBe("playing");
    expect(result.current.game.currentPlayer).toBeDefined();
    expect(result.current.game.currentPlayer?.name).toBe("Player 1");
  });

  it("should submit score and advance turn", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Setup game with two players
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    act(() => {
      result.current.game.startGame();
    });

    expect(result.current.game.gameState).toBe("playing");
    expect(result.current.game.currentPlayer?.name).toBe("Player 1");

    act(() => {
      const response = result.current.game.submitScore(5);
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.game.currentPlayer?.name).toBe("Player 2");
    expect(result.current.game.currentPlayerIndex).toBe(1);
  });

  it("should not submit score when game is not active", () => {
    const { result } = renderHook(() => useGameFlow(), { wrapper });

    act(() => {
      const response = result.current.submitScore(5);
      expect(response.success).toBe(false);
      expect(response.error).toContain(
        "Cannot submit score when game is not active"
      );
    });
  });

  it("should validate score range", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Setup game
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    act(() => {
      result.current.game.startGame();
    });

    expect(result.current.game.gameState).toBe("playing");

    // Test invalid scores
    act(() => {
      const response1 = result.current.game.submitScore(-1);
      expect(response1.success).toBe(false);
      expect(response1.error).toContain("Score must be between 0 and 50");

      const response2 = result.current.game.submitScore(51);
      expect(response2.success).toBe(false);
      expect(response2.error).toContain("Score must be between 0 and 50");
    });

    // Test valid score
    act(() => {
      const response = result.current.game.submitScore(5);
      expect(response.success).toBe(true);
    });
  });

  it("should apply penalty and advance turn", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Setup game
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    act(() => {
      result.current.game.startGame();
    });

    expect(result.current.game.gameState).toBe("playing");
    expect(result.current.game.currentPlayer?.name).toBe("Player 1");

    act(() => {
      const response = result.current.game.applyPenalty("Test penalty");
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.game.currentPlayer?.name).toBe("Player 2");
    // Player 1 should have score reset to 25 and penalty count increased
    const player1 = result.current.player.getPlayerByName("Player 1");
    expect(player1?.score).toBe(25);
    expect(player1?.penalties).toBe(1);
  });

  it("should not apply penalty when game is not active", () => {
    const { result } = renderHook(() => useGameFlow(), { wrapper });

    act(() => {
      const response = result.current.applyPenalty();
      expect(response.success).toBe(false);
      expect(response.error).toContain(
        "Cannot apply penalty when game is not active"
      );
    });
  });

  it("should advance to next turn manually", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Setup game
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    act(() => {
      result.current.game.startGame();
    });

    expect(result.current.game.gameState).toBe("playing");
    expect(result.current.game.currentPlayer?.name).toBe("Player 1");

    act(() => {
      const response = result.current.game.nextTurn();
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.game.currentPlayer?.name).toBe("Player 2");
  });

  it("should not advance turn when game is not active", () => {
    const { result } = renderHook(() => useGameFlow(), { wrapper });

    act(() => {
      const response = result.current.nextTurn();
      expect(response.success).toBe(false);
      expect(response.error).toContain(
        "Cannot advance turn when game is not active"
      );
    });
  });

  it("should calculate points needed for player", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Add player and start game
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    act(() => {
      result.current.game.startGame();
    });

    const player1 = result.current.player.getPlayerByName("Player 1");
    expect(player1).toBeDefined();

    if (player1) {
      const pointsNeeded = result.current.game.getPointsNeededForPlayer(
        player1.id
      );
      expect(pointsNeeded).toBe(50); // Player starts with 0 points
    }
  });

  it("should check if it's a player's turn", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Setup game
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    act(() => {
      result.current.game.startGame();
    });

    const player1 = result.current.player.getPlayerByName("Player 1");
    const player2 = result.current.player.getPlayerByName("Player 2");

    expect(player1).toBeDefined();
    expect(player2).toBeDefined();

    if (player1 && player2) {
      expect(result.current.game.isPlayerTurn(player1.id)).toBe(true);
      expect(result.current.game.isPlayerTurn(player2.id)).toBe(false);
    }
  });

  it("should reset game state", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Add players and start game
    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    act(() => {
      result.current.game.startGame();
    });

    expect(result.current.game.gameState).toBe("playing");
    expect(result.current.player.players).toHaveLength(2);

    act(() => {
      const response = result.current.game.resetGame();
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.game.gameState).toBe("setup");
    expect(result.current.player.players).toHaveLength(0);
  });
});
