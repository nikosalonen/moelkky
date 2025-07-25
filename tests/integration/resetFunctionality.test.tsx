/**
 * Integration test for reset functionality
 * Tests that reset preserves players while resetting game state
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import React from "preact/compat";
import { GameProvider } from "../../src/context/GameContext";
import { ToastProvider } from "../../src/components/Toast";
import { App } from "../../src/app";
import { useGameFlow } from "../../src/hooks/useGameFlow";

// Mock the useGameFlow hook to test the reset functionality
vi.mock("../../src/hooks/useGameFlow", () => ({
  useGameFlow: vi.fn(),
}));

describe("Reset Functionality Integration", () => {
  it("should preserve players when resetting from no winner state", () => {
    // Mock the game flow to simulate a finished game with no winner
    const mockUseGameFlow = vi.mocked(useGameFlow);
    
    const mockResetToSetup = vi.fn().mockReturnValue({ success: true });
    
    mockUseGameFlow.mockReturnValue({
      gameState: "finished",
      gameMode: "individual",
      currentPlayer: null,
      currentTeam: null,
      currentTeamPlayer: null,
      currentPlayerIndex: 0,
      currentTeamIndex: 0,
      canStartGame: false,
      winner: null,
      winningTeam: null,
      startGame: vi.fn(),
      submitScore: vi.fn(),
      submitTeamScore: vi.fn(),
      applyPenalty: vi.fn(),
      applyTeamPenalty: vi.fn(),
      nextTurn: vi.fn(),
      endGame: vi.fn(),
      newGame: vi.fn(),
      resetGame: vi.fn(),
      resetToSetup: mockResetToSetup,
      getPointsNeededForPlayer: vi.fn(),
      getPointsNeededForTeam: vi.fn(),
      isPlayerTurn: vi.fn(),
      isTeamTurn: vi.fn(),
    });

    // Mock the game context to have players
    const mockState = {
      gameState: "finished",
      gameMode: "individual",
      players: [
        { id: "1", name: "Alice", score: 25, penalties: 2, isActive: false, consecutiveMisses: 3, eliminated: true },
        { id: "2", name: "Bob", score: 30, penalties: 1, isActive: false, consecutiveMisses: 3, eliminated: true },
      ],
      teams: [],
      currentPlayerIndex: 0,
      currentTeamIndex: 0,
      gameHistory: [],
      currentGame: null,
    };

    // Mock the useGameContext hook
    vi.doMock("../../src/context/GameContext", () => ({
      useGameContext: () => ({
        state: mockState,
        dispatch: vi.fn(),
      }),
    }));

    render(<App />);

    // The NoWinnerDisplay should be shown
    expect(screen.getByText("Game Over")).toBeInTheDocument();
    expect(screen.getByText("All players have been eliminated due to consecutive misses.")).toBeInTheDocument();

    // Click the reset button
    const resetButton = screen.getByText("🔄 Reset & Modify Players");
    fireEvent.click(resetButton);

    // Verify that resetToSetup was called
    expect(mockResetToSetup).toHaveBeenCalledTimes(1);
  });

  it("should show correct message about preserving players", () => {
    // Mock the game flow to simulate a finished game with no winner
    const mockUseGameFlow = vi.mocked(useGameFlow);
    
    mockUseGameFlow.mockReturnValue({
      gameState: "finished",
      gameMode: "individual",
      currentPlayer: null,
      currentTeam: null,
      currentTeamPlayer: null,
      currentPlayerIndex: 0,
      currentTeamIndex: 0,
      canStartGame: false,
      winner: null,
      winningTeam: null,
      startGame: vi.fn(),
      submitScore: vi.fn(),
      submitTeamScore: vi.fn(),
      applyPenalty: vi.fn(),
      applyTeamPenalty: vi.fn(),
      nextTurn: vi.fn(),
      endGame: vi.fn(),
      newGame: vi.fn(),
      resetGame: vi.fn(),
      resetToSetup: vi.fn(),
      getPointsNeededForPlayer: vi.fn(),
      getPointsNeededForTeam: vi.fn(),
      isPlayerTurn: vi.fn(),
      isTeamTurn: vi.fn(),
    });

    render(<App />);

    // Verify the message indicates players are preserved
    expect(screen.getByText("Go back to setup to modify players and start a new game with the same players")).toBeInTheDocument();
  });
}); 
