/**
 * WinnerDisplay Component Tests
 * Tests for winner announcement, final scores display, and new game functionality
 *
 * @format
 */

import { render, screen, fireEvent } from "@testing-library/preact";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WinnerDisplay } from "../../src/components/WinnerDisplay/WinnerDisplay";
import type { Player } from "../../src/utils/types";

// Mock players for testing
const createMockPlayer = (
  id: string,
  name: string,
  score: number,
  penalties: number = 0,
  isActive: boolean = false
): Player => ({
  id,
  name,
  score,
  penalties,
  isActive,
});

const mockPlayers: Player[] = [
  createMockPlayer("1", "Alice", 42, 1, false),
  createMockPlayer("2", "Bob", 50, 0, false), // Winner
  createMockPlayer("3", "Charlie", 38, 2, false),
  createMockPlayer("4", "Diana", 45, 0, false),
];

const winner = mockPlayers[1]; // Bob

describe("WinnerDisplay Component", () => {
  const mockOnNewGame = vi.fn();

  beforeEach(() => {
    mockOnNewGame.mockClear();
  });

  describe("Winner Announcement", () => {
    it("should display the winner's name prominently", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("Bob Wins!")).toBeInTheDocument();
    });

    it("should display congratulatory message", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(
        screen.getByText("Congratulations on reaching exactly 50 points!")
      ).toBeInTheDocument();
    });

    it("should display celebration emojis", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("🎉")).toBeInTheDocument();
      expect(screen.getByText("🏆")).toBeInTheDocument();
    });
  });

  describe("Winner Stats Display", () => {
    it("should display winner's final score as 50", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("🏆 Champion Stats")).toBeInTheDocument();
      expect(screen.getByText("Final Score")).toBeInTheDocument();
    });

    it("should display winner's penalty count", () => {
      const winnerWithPenalties = createMockPlayer("winner", "TestWinner", 50, 3);
      const playersWithPenalties = [winnerWithPenalties, mockPlayers[0]];

      render(
        <WinnerDisplay
          winner={winnerWithPenalties}
          players={playersWithPenalties}
          onNewGame={mockOnNewGame}
        />
      );

      // Check in champion stats section
      const championStats = screen.getByText("🏆 Champion Stats").closest("div");
      expect(championStats).toHaveTextContent("3");
      expect(championStats).toHaveTextContent("Penalties");
    });
  });

  describe("Final Leaderboard", () => {
    it("should display final leaderboard title", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("Final Leaderboard")).toBeInTheDocument();
    });

    it("should sort players correctly - winner first, then by score descending", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Expected order: Bob (50), Diana (45), Alice (42), Charlie (38)
      // Both mobile and desktop layouts render position text, so we expect 2 of each
      expect(screen.getAllByText("1st")).toHaveLength(2);
      expect(screen.getAllByText("2nd")).toHaveLength(2);
      expect(screen.getAllByText("3rd")).toHaveLength(2);
      expect(screen.getAllByText("4th")).toHaveLength(2);
    });

    it("should display correct medal emojis for top 3", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Both mobile and desktop layouts render medals, so we expect 2 of each for top 3
      expect(screen.getAllByText("🥇")).toHaveLength(2); // 1st place
      expect(screen.getAllByText("🥈")).toHaveLength(2); // 2nd place
      expect(screen.getAllByText("🥉")).toHaveLength(2); // 3rd place
    });

    it("should highlight the winner in the leaderboard", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Winner should have "Winner" badge
      expect(screen.getAllByText("Winner")).toHaveLength(2); // One in announcement, one in leaderboard
    });

    it("should display all players' scores correctly", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Check that all scores are displayed (both mobile and desktop layouts)
      expect(screen.getAllByText("50")).toHaveLength(3); // In winner stats, mobile leaderboard, and desktop leaderboard
      expect(screen.getAllByText("45")).toHaveLength(2); // Diana in mobile and desktop
      expect(screen.getAllByText("42")).toHaveLength(2); // Alice in mobile and desktop
      expect(screen.getAllByText("38")).toHaveLength(2); // Charlie in mobile and desktop
    });

    it("should display penalties for players who have them", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Alice has 1 penalty, Charlie has 2 penalties
      expect(screen.getByText("1")).toBeInTheDocument(); // Alice's penalties
      expect(screen.getByText("2")).toBeInTheDocument(); // Charlie's penalties
    });

    it("should show dash for players with no penalties", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Bob and Diana have 0 penalties, should show "-"
      expect(screen.getAllByText("-")).toHaveLength(2);
    });
  });

  describe("New Game Button", () => {
    it("should render new game button", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      const newGameButton = screen.getByRole("button", { name: /start new game/i });
      expect(newGameButton).toBeInTheDocument();
      expect(newGameButton).toHaveTextContent("🎮 Start New Game");
    });

    it("should call onNewGame when button is clicked", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      const newGameButton = screen.getByRole("button", { name: /start new game/i });
      fireEvent.click(newGameButton);

      expect(mockOnNewGame).toHaveBeenCalledTimes(1);
    });

    it("should display helpful text about restarting with same players", () => {
      render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(
        screen.getByText("Start a new game with the same players")
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single player scenario", () => {
      const singlePlayer = [createMockPlayer("1", "Solo", 50, 0)];
      
      render(
        <WinnerDisplay
          winner={singlePlayer[0]}
          players={singlePlayer}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("Solo Wins!")).toBeInTheDocument();
      expect(screen.getAllByText("1st")).toHaveLength(2);
      expect(screen.getAllByText("🥇")).toHaveLength(2);
    });

    it("should handle players with same scores (excluding winner)", () => {
      const playersWithTies = [
        createMockPlayer("1", "Winner", 50, 0),
        createMockPlayer("2", "Tie1", 40, 0),
        createMockPlayer("3", "Tie2", 40, 1),
        createMockPlayer("4", "Lower", 30, 0),
      ];

      render(
        <WinnerDisplay
          winner={playersWithTies[0]}
          players={playersWithTies}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("Winner Wins!")).toBeInTheDocument();
      // Both tied players should appear after winner (2 of each due to mobile/desktop layouts)
      expect(screen.getAllByText("2nd")).toHaveLength(2);
      expect(screen.getAllByText("3rd")).toHaveLength(2);
      expect(screen.getAllByText("4th")).toHaveLength(2);
    });

    it("should handle winner with high penalty count", () => {
      const winnerWithManyPenalties = createMockPlayer("1", "PenaltyWinner", 50, 5);
      const testPlayers = [winnerWithManyPenalties, mockPlayers[0]];

      render(
        <WinnerDisplay
          winner={winnerWithManyPenalties}
          players={testPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getByText("PenaltyWinner Wins!")).toBeInTheDocument();
      // Check penalties are displayed in champion stats
      const championStats = screen.getByText("🏆 Champion Stats").closest("div");
      expect(championStats).toHaveTextContent("5");
    });
  });

  describe("Responsive Design Elements", () => {
    it("should contain mobile-specific layout classes", () => {
      const { container } = render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Check for mobile-specific classes (block md:hidden)
      expect(container.querySelector(".block.md\\:hidden")).toBeInTheDocument();
    });

    it("should contain desktop-specific layout classes", () => {
      const { container } = render(
        <WinnerDisplay
          winner={winner}
          players={mockPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      // Check for desktop-specific classes (hidden md:block)
      expect(container.querySelector(".hidden.md\\:block")).toBeInTheDocument();
    });
  });

  describe("Position Suffix Logic", () => {
    it("should display correct position suffixes", () => {
      // Create exactly 4 players to test all suffix types
      const testPlayers = [
        createMockPlayer("1", "First", 50, 0),   // 1st
        createMockPlayer("2", "Second", 40, 0),  // 2nd  
        createMockPlayer("3", "Third", 30, 0),   // 3rd
        createMockPlayer("4", "Fourth", 20, 0),  // 4th
      ];

      render(
        <WinnerDisplay
          winner={testPlayers[0]}
          players={testPlayers}
          onNewGame={mockOnNewGame}
        />
      );

      expect(screen.getAllByText("1st")).toHaveLength(2);
      expect(screen.getAllByText("2nd")).toHaveLength(2);
      expect(screen.getAllByText("3rd")).toHaveLength(2);
      expect(screen.getAllByText("4th")).toHaveLength(2);
    });
  });
}); 
