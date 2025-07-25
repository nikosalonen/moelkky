/**
 * Tests for NoWinnerDisplay Component
 * Tests the display when a game ends without a winner
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { NoWinnerDisplay } from "../../src/components/NoWinnerDisplay";
import React from "preact/compat";

// Mock data
const createMockPlayer = (id: string, name: string, score: number, eliminated: boolean = false) => ({
  id,
  name,
  score,
  penalties: 0,
  isActive: false,
  consecutiveMisses: 0,
  eliminated,
});

const createMockTeam = (id: string, name: string, score: number, eliminated: boolean = false) => ({
  id,
  name,
  score,
  penalties: 0,
  isActive: false,
  consecutiveMisses: 0,
  eliminated,
  currentPlayerIndex: 0,
  players: [
    createMockPlayer("1", "Player 1", 0),
    createMockPlayer("2", "Player 2", 0),
  ],
});

describe("NoWinnerDisplay Component", () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    mockOnReset.mockClear();
  });

  describe("Individual Game Mode", () => {
    const mockPlayers = [
      createMockPlayer("1", "Alice", 25, true), // Eliminated
      createMockPlayer("2", "Bob", 30, true),   // Eliminated
      createMockPlayer("3", "Charlie", 15, true), // Eliminated
    ];

    it("should display game over message for individual mode", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("Game Over")).toBeInTheDocument();
      expect(screen.getByText("All players have been eliminated due to consecutive misses.")).toBeInTheDocument();
    });

    it("should display elimination summary", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("🚫 Elimination Summary")).toBeInTheDocument();
      expect(screen.getByText("Players Eliminated")).toBeInTheDocument();
      expect(screen.getByText("Total Players")).toBeInTheDocument();
    });

    it("should display final standings with eliminated players", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("Final Standings")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getAllByText("Eliminated").length).toBeGreaterThan(0);
    });

    it("should call onReset when reset button is clicked", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByText("🔄 Reset & Modify Players");
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it("should display players sorted by score (highest first)", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      // Check that players are displayed in order of score (Bob: 30, Alice: 25, Charlie: 15)
      const playerNames = screen.getAllByText(/Alice|Bob|Charlie/);
      expect(playerNames[0].textContent).toBe("Bob"); // Highest score first
      expect(playerNames[1].textContent).toBe("Alice");
      expect(playerNames[2].textContent).toBe("Charlie");
    });
  });

  describe("Team Game Mode", () => {
    const mockTeams = [
      createMockTeam("1", "Team Alpha", 20, true), // Eliminated
      createMockTeam("2", "Team Beta", 35, true),  // Eliminated
    ];

    it("should display game over message for team mode", () => {
      render(
        <NoWinnerDisplay
          players={[]}
          teams={mockTeams}
          gameMode="team"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("Game Over")).toBeInTheDocument();
      expect(screen.getByText("All teams have been eliminated due to consecutive misses.")).toBeInTheDocument();
    });

    it("should display elimination summary for teams", () => {
      render(
        <NoWinnerDisplay
          players={[]}
          teams={mockTeams}
          gameMode="team"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("🚫 Elimination Summary")).toBeInTheDocument();
      expect(screen.getByText("Teams Eliminated")).toBeInTheDocument();
      expect(screen.getByText("Total Teams")).toBeInTheDocument();
    });

    it("should display final standings with eliminated teams", () => {
      render(
        <NoWinnerDisplay
          players={[]}
          teams={mockTeams}
          gameMode="team"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("Final Standings")).toBeInTheDocument();
      expect(screen.getByText("Team Alpha")).toBeInTheDocument();
      expect(screen.getByText("Team Beta")).toBeInTheDocument();
      expect(screen.getAllByText("Eliminated").length).toBeGreaterThan(0);
    });

    it("should display teams sorted by score (highest first)", () => {
      render(
        <NoWinnerDisplay
          players={[]}
          teams={mockTeams}
          gameMode="team"
          onReset={mockOnReset}
        />
      );

      // Check that teams are displayed in order of score (Team Beta: 35, Team Alpha: 20)
      const teamNames = screen.getAllByText(/Team Alpha|Team Beta/);
      expect(teamNames[0].textContent).toBe("Team Beta"); // Highest score first
      expect(teamNames[1].textContent).toBe("Team Alpha");
    });
  });

  describe("Mixed Elimination States", () => {
    const mixedPlayers = [
      createMockPlayer("1", "Alice", 25, true),   // Eliminated
      createMockPlayer("2", "Bob", 30, false),    // Not eliminated
      createMockPlayer("3", "Charlie", 15, true), // Eliminated
    ];

    it("should handle mixed elimination states", () => {
      render(
        <NoWinnerDisplay
          players={mixedPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("Players Eliminated")).toBeInTheDocument();
      expect(screen.getByText("Total Players")).toBeInTheDocument();
      
      // Should show both eliminated and active players
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      
      // Should show elimination status correctly
      expect(screen.getAllByText("Eliminated").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility and UI", () => {
    const mockPlayers = [
      createMockPlayer("1", "Alice", 25, true),
      createMockPlayer("2", "Bob", 30, true),
    ];

    it("should have proper button styling and hover effects", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByText("🔄 Reset & Modify Players");
      expect(resetButton).toHaveClass("bg-blue-500");
      expect(resetButton).toHaveClass("hover:bg-blue-600");
      expect(resetButton).toHaveClass("transform");
      expect(resetButton).toHaveClass("hover:scale-105");
    });

    it("should display helpful description text", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("Go back to setup to modify players and start a new game with the same players")).toBeInTheDocument();
    });

    it("should display appropriate emojis and visual elements", () => {
      render(
        <NoWinnerDisplay
          players={mockPlayers}
          gameMode="individual"
          onReset={mockOnReset}
        />
      );

      expect(screen.getByText("😔")).toBeInTheDocument();
      expect(screen.getAllByText("💔")).toHaveLength(2);
      expect(screen.getByText("🎯")).toBeInTheDocument();
      expect(screen.getByText("🚫 Elimination Summary")).toBeInTheDocument();
      expect(screen.getByText("🔄 Reset & Modify Players")).toBeInTheDocument();
    });
  });
}); 
