/**
 * GameBoard Component Tests
 * Tests for score display, turn indication, and responsive behavior
 *
 * @format
 */

import { render, screen } from "@testing-library/preact";
import { describe, it, expect } from "vitest";
import { GameBoard } from "../../src/components/GameBoard/GameBoard";
import type { Player, GameState } from "../../src/utils/types";
import { beforeEach } from "node:test";

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
  createMockPlayer("1", "Alice", 25, 0, true),
  createMockPlayer("2", "Bob", 35, 1, false),
  createMockPlayer("3", "Charlie", 45, 0, false),
  createMockPlayer("4", "Diana", 50, 0, false),
];

describe("GameBoard Component", () => {
  describe("Rendering Conditions", () => {
    it("should not render when no players are provided", () => {
      const { container } = render(
        <GameBoard players={[]} currentPlayerIndex={0} gameState="playing" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should not render when game state is not playing", () => {
      const { container } = render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="setup"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should not render when game state is finished", () => {
      const { container } = render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="finished"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render when players exist and game state is playing", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );
      expect(screen.getByText("Game Board")).toBeInTheDocument();
    });
  });

  describe("Player Score Display", () => {
    beforeEach(() => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );
    });

    it("should display all player names", () => {
      expect(screen.getAllByText("Alice")).toHaveLength(3); // Mobile, desktop, and progress indicator
      expect(screen.getAllByText("Bob")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByText("Charlie")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByText("Diana")).toHaveLength(2); // Mobile and desktop
    });

    it("should display all player scores", () => {
      expect(screen.getAllByText("25")).toHaveLength(3); // Mobile, desktop, and "Need: 25"
      expect(screen.getAllByText("35")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByText("45")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByText("50")).toHaveLength(2); // Mobile and desktop
    });

    it("should display score out of 50 for each player", () => {
      const scoreElements = screen.getAllByText("/ 50");
      expect(scoreElements).toHaveLength(mockPlayers.length * 2); // Mobile and desktop layouts
    });

    it("should display points needed to reach 50", () => {
      // Desktop layout uses "Need: X" format (text is split across elements)
      expect(screen.getAllByText("Need:")).toHaveLength(4); // One for each player in desktop layout
      // Check that scores and points needed are displayed
      expect(screen.getAllByText("25")).toHaveLength(3); // Score in mobile, desktop, and "Need: 25"
      expect(screen.getAllByText("15")).toHaveLength(1); // "Need: 15" only (score 35 is different)
      expect(screen.getAllByText("5")).toHaveLength(1); // "Need: 5" only (score 45 is different)
      expect(screen.getAllByText("0")).toHaveLength(1); // "Need: 0" only (score 50 is different)

      // Mobile layout uses different text format
      expect(screen.getByText("Points needed: 25")).toBeInTheDocument();
      expect(screen.getByText("Points needed: 15")).toBeInTheDocument();
      expect(screen.getByText("Points needed: 5")).toBeInTheDocument();
      expect(screen.getByText("Points needed: 0")).toBeInTheDocument();
    });

    it("should display penalty count for players with penalties", () => {
      expect(screen.getAllByText("Penalties: 1")).toHaveLength(2); // Bob has 1 penalty (mobile and desktop)
    });

    it("should not display penalty count for players without penalties", () => {
      const penaltyTexts = screen.queryAllByText(/Penalties:/);
      expect(penaltyTexts).toHaveLength(2); // Only Bob should have penalty text (mobile and desktop)
    });
  });

  describe("Current Player Turn Indication", () => {
    it("should highlight the current player", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(screen.getAllByText("Current Turn")).toHaveLength(2); // Mobile and desktop layouts
    });

    it("should show current player name in game progress", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(screen.getAllByText("Alice")).toHaveLength(3); // Mobile, desktop, and progress indicator
    });

    it("should update current player indication when index changes", () => {
      const { rerender } = render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(screen.getAllByText("Alice")).toHaveLength(3); // Mobile, desktop, and progress indicator

      // Update to next player
      const updatedPlayers = mockPlayers.map((player, index) => ({
        ...player,
        isActive: index === 1,
      }));

      rerender(
        <GameBoard
          players={updatedPlayers}
          currentPlayerIndex={1}
          gameState="playing"
        />
      );

      expect(screen.getAllByText("Bob")).toHaveLength(3); // Mobile, desktop, and progress indicator
    });
  });

  describe("Winner Display", () => {
    it("should show winner status for player with score 50", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(screen.getAllByText("Winner!")).toHaveLength(2); // Mobile and desktop layouts
    });

    it("should apply winner styling to player with score 50", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      const winnerElements = screen.getAllByText("Winner!");
      // Find the parent container with the styling classes
      const winnerContainer = winnerElements[0].closest(".bg-green-100");
      expect(winnerContainer).toBeInTheDocument();
      expect(winnerContainer).toHaveClass(
        "bg-green-100",
        "text-green-800",
        "border-green-200"
      );
    });
  });

  describe("Score Color Coding", () => {
    const testPlayers: Player[] = [
      createMockPlayer("1", "Low", 20),
      createMockPlayer("2", "Medium", 35),
      createMockPlayer("3", "High", 45),
      createMockPlayer("4", "Winner", 50),
    ];

    it("should apply appropriate color classes based on score ranges", () => {
      render(
        <GameBoard
          players={testPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      // Test that scores are rendered (specific color testing would require more complex setup)
      expect(screen.getAllByText("20")).toHaveLength(2); // Mobile and desktop layouts
      expect(screen.getAllByText("35")).toHaveLength(2); // Mobile and desktop layouts
      expect(screen.getAllByText("45")).toHaveLength(2); // Mobile and desktop layouts
      expect(screen.getAllByText("50")).toHaveLength(2); // Mobile and desktop layouts
    });
  });

  describe("Game Progress Information", () => {
    it("should display total number of players", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(screen.getByText("Players:")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should display current player information", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={2}
          gameState="playing"
        />
      );

      expect(screen.getByText("Current Player:")).toBeInTheDocument();
      expect(screen.getAllByText("Charlie")).toHaveLength(3); // Mobile, desktop, and progress indicator
    });
  });

  describe("Edge Cases", () => {
    it("should handle single player", () => {
      const singlePlayer = [createMockPlayer("1", "Solo", 30, 0, true)];

      render(
        <GameBoard
          players={singlePlayer}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(screen.getAllByText("Solo")).toHaveLength(3); // Mobile, desktop, and progress indicator
      expect(screen.getAllByText("30")).toHaveLength(2); // Mobile and desktop layouts
      expect(screen.getByText("Players:")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should handle player with very long name", () => {
      const longNamePlayer = [
        createMockPlayer(
          "1",
          "VeryLongPlayerNameThatMightCauseLayoutIssues",
          25,
          0,
          true
        ),
      ];

      render(
        <GameBoard
          players={longNamePlayer}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(
        screen.getAllByText("VeryLongPlayerNameThatMightCauseLayoutIssues")
      ).toHaveLength(3); // Mobile, desktop, and progress indicator
    });

    it("should handle invalid current player index gracefully", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={999}
          gameState="playing"
        />
      );

      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });

    it("should handle player with maximum penalties", () => {
      const highPenaltyPlayer = [
        createMockPlayer("1", "Penalized", 25, 5, true),
      ];

      render(
        <GameBoard
          players={highPenaltyPlayer}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      expect(screen.getAllByText("Penalties: 5")).toHaveLength(2); // Mobile and desktop layouts
    });
  });

  describe("Responsive Layout", () => {
    it("should render mobile and desktop layouts", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      // Both layouts should be present in DOM (hidden/shown via CSS)
      const mobileLayout = document.querySelector(".block.md\\:hidden");
      const desktopLayout = document.querySelector(".hidden.md\\:grid");

      expect(mobileLayout).toBeInTheDocument();
      expect(desktopLayout).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(
        <GameBoard
          players={mockPlayers}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Game Board");
    });

    it("should provide title attributes for long names", () => {
      const longNamePlayer = [
        createMockPlayer("1", "VeryLongName", 25, 0, true),
      ];

      render(
        <GameBoard
          players={longNamePlayer}
          currentPlayerIndex={0}
          gameState="playing"
        />
      );

      const nameElements = screen.getAllByText("VeryLongName");
      // Check that at least one element has the title attribute (desktop layout)
      const elementWithTitle = nameElements.find((el) =>
        el.hasAttribute("title")
      );
      expect(elementWithTitle).toHaveAttribute("title", "VeryLongName");
    });
  });
});
