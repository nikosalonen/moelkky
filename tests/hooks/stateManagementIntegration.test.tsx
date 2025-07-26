/**
 * Integration tests for state management hooks working together
 *
 * @format
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import type { ComponentChildren } from "preact";
import { GameProvider } from "../../src/context/GameContext";
import { usePlayerManagement } from "../../src/hooks/usePlayerManagement";
import { useGameFlow } from "../../src/hooks/useGameFlow";
import { useGameHistory } from "../../src/hooks/useGameHistory";

// Mock session storage
vi.mock("../../src/utils/storage/sessionStorage", () => ({
  sessionStorageUtil: {
    loadAppState: vi.fn(() => null),
    saveAppState: vi.fn(),
    saveCurrentGame: vi.fn(),
    saveGameHistory: vi.fn(),
    clearAll: vi.fn(),
  },
}));

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: ComponentChildren }) => (
  <GameProvider>{children}</GameProvider>
);

describe("State Management Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle complete game flow from setup to finish", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
        history: useGameHistory(),
      }),
      { wrapper }
    );

    // Initial state
    expect(result.current.game.gameState).toBe("setup");
    expect(result.current.player.players).toHaveLength(0);
    expect(result.current.game.canStartGame).toBe(false);

    // Add players
    act(() => {
      result.current.player.addPlayer("Alice");
      result.current.player.addPlayer("Bob");
    });

    expect(result.current.player.players).toHaveLength(2);
    expect(result.current.game.canStartGame).toBe(true);

    // Start game
    act(() => {
      const response = result.current.game.startGame();
      expect(response.success).toBe(true);
    });

    expect(result.current.game.gameState).toBe("playing");
    expect(result.current.game.currentPlayer?.name).toBe("Alice");

    // Alice scores 10
    act(() => {
      const response = result.current.game.submitScore(10, "single");
      expect(response.success).toBe(true);
    });

    expect(result.current.game.currentPlayer?.name).toBe("Bob");
    expect(result.current.player.getPlayerByName("Alice")?.score).toBe(10);

    // Bob scores 12 (valid score)
    act(() => {
      const response = result.current.game.submitScore(12, "single");
      expect(response.success).toBe(true);
    });

    expect(result.current.game.currentPlayer?.name).toBe("Alice");
    expect(result.current.player.getPlayerByName("Bob")?.score).toBe(12);

    // Apply penalty to Alice
    act(() => {
      result.current.game.applyPenalty("Throwing violation");
    });

    expect(result.current.game.currentPlayer?.name).toBe("Bob");
    expect(result.current.player.getPlayerByName("Alice")?.score).toBe(25); // Reset to 25
    expect(result.current.player.getPlayerByName("Alice")?.penalties).toBe(1);

    // Continue playing until someone wins
    // Bob needs 38 more points to reach 50 (12 + 38 = 50)
    act(() => {
      result.current.game.submitScore(12, "single"); // Bob: 24
    });
    act(() => {
      result.current.game.submitScore(0, "single"); // Alice: miss
    });
    act(() => {
      result.current.game.submitScore(12, "single"); // Bob: 36
    });
    act(() => {
      result.current.game.submitScore(0, "single"); // Alice: miss
    });
    act(() => {
      result.current.game.submitScore(12, "single"); // Bob: 48
    });
    act(() => {
      result.current.game.submitScore(0, "single"); // Alice: miss (eliminated)
    });

    expect(result.current.game.gameState).toBe("finished");
    expect(result.current.game.winner?.name).toBe("Bob");

    // Start new game
    act(() => {
      const response = result.current.game.newGame();
      expect(response.success).toBe(true);
    });

    expect(result.current.game.gameState).toBe("setup");
    expect(result.current.player.players).toHaveLength(2); // Players preserved
    expect(result.current.player.getPlayerByName("Alice")?.score).toBe(0); // Scores reset
    expect(result.current.player.getPlayerByName("Bob")?.score).toBe(0);
    expect(result.current.history.gameHistory).toHaveLength(1); // Game added to history
  });

  it("should handle player modifications during different game states", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Can modify players in setup
    expect(result.current.player.canModifyPlayers).toBe(true);

    act(() => {
      result.current.player.addPlayer("Player 1");
      result.current.player.addPlayer("Player 2");
    });

    // Start game
    act(() => {
      result.current.game.startGame();
    });

    // Cannot modify players during game
    expect(result.current.player.canModifyPlayers).toBe(false);

    act(() => {
      const response = result.current.player.addPlayer("Player 3");
      expect(response.success).toBe(false);
      expect(response.error).toContain(
        "Cannot modify players during active game"
      );
    });

    // Cannot modify player names during game
    const player1 = result.current.player.getPlayerByName("Player 1");
    if (player1) {
      act(() => {
        const response = result.current.player.updatePlayer(player1.id, {
          name: "New Name",
        });
        expect(response.success).toBe(false);
        expect(response.error).toContain(
          "Cannot modify player names during active game"
        );
      });
    }
  });

  it("should handle score overflow correctly", () => {
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

    // Get Player 1 to 45 points by submitting multiple scores
    act(() => {
      result.current.game.submitScore(12, "single"); // Player 1: 12
    });
    act(() => {
      result.current.game.submitScore(5, "single"); // Player 2: 5, back to Player 1
    });
    act(() => {
      result.current.game.submitScore(12, "single"); // Player 1: 24
    });
    act(() => {
      result.current.game.submitScore(5, "single"); // Player 2: 10, back to Player 1
    });
    act(() => {
      result.current.game.submitScore(12, "single"); // Player 1: 36
    });
    act(() => {
      result.current.game.submitScore(5, "single"); // Player 2: 15, back to Player 1
    });
    act(() => {
      result.current.game.submitScore(9, "single"); // Player 1: 45
    });

    expect(result.current.player.getPlayerByName("Player 1")?.score).toBe(45);

    // Now score 6 points (would be 51, should reset to 25)
    act(() => {
      result.current.game.submitScore(5, "single"); // Player 2: 20, back to Player 1
    });
    act(() => {
      result.current.game.submitScore(6, "single"); // Player 1: should be 25 (reset)
    });

    expect(result.current.player.getPlayerByName("Player 1")?.score).toBe(25);
    expect(result.current.game.gameState).toBe("playing"); // Game continues
  });

  it("should handle winning condition correctly", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
      }),
      { wrapper }
    );

    // Setup game
    act(() => {
      result.current.player.addPlayer("Winner");
      result.current.player.addPlayer("Loser");
    });

    act(() => {
      result.current.game.startGame();
    });

    // Get Winner to exactly 50 points by building up score
    act(() => {
      result.current.game.submitScore(12, "single"); // Winner: 12
    });
    act(() => {
      result.current.game.submitScore(0, "single"); // Loser: 0, back to Winner
    });
    act(() => {
      result.current.game.submitScore(12, "single"); // Winner: 24
    });
    act(() => {
      result.current.game.submitScore(0, "single"); // Loser: 0, back to Winner
    });
    act(() => {
      result.current.game.submitScore(12, "single"); // Winner: 36
    });
    act(() => {
      result.current.game.submitScore(0, "single"); // Loser: 0, back to Winner
    });
    act(() => {
      result.current.game.submitScore(12, "single"); // Winner: 48
    });
    act(() => {
      result.current.game.submitScore(0, "single"); // Loser: 0, back to Winner
    });
    act(() => {
      result.current.game.submitScore(2, "single"); // Winner: 50 - WINS!
    });

    expect(result.current.game.gameState).toBe("finished");
    expect(result.current.game.winner?.name).toBe("Winner");
    expect(result.current.player.getPlayerByName("Winner")?.score).toBe(36);
  });

  it("should maintain state consistency across all hooks", () => {
    const { result } = renderHook(
      () => ({
        player: usePlayerManagement(),
        game: useGameFlow(),
        history: useGameHistory(),
      }),
      { wrapper }
    );

    // All hooks should reflect the same initial state
    expect(result.current.game.gameState).toBe("setup");
    expect(result.current.player.players).toHaveLength(0);
    expect(result.current.history.gameHistory).toHaveLength(0);

    // Add players - all hooks should see the change
    act(() => {
      result.current.player.addPlayer("Test Player");
    });

    expect(result.current.player.players).toHaveLength(1);
    expect(result.current.game.canStartGame).toBe(false); // Still need 2 players

    act(() => {
      result.current.player.addPlayer("Another Player");
    });

    expect(result.current.player.players).toHaveLength(2);
    expect(result.current.game.canStartGame).toBe(true);

    // Start game - all hooks should reflect the state change
    act(() => {
      result.current.game.startGame();
    });

    expect(result.current.game.gameState).toBe("playing");
    expect(result.current.player.canModifyPlayers).toBe(false);
    expect(result.current.history.currentGame).toBeDefined();
  });
});
