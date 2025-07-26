/**
 * Example test for the updated ScoreInput component
 * Demonstrates how to test the new pin selection interface
 *
 * @format
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { h } from "preact";
import { ScoreInput } from "../../src/components/ScoreInput/ScoreInput";
import { GameProvider } from "../../src/context/GameContext";
import { createMockPlayer } from "../testUtils";

// Mock the Toast component to avoid dependency issues
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

function renderScoreInput(props = {}) {
  const defaultProps = {
    currentPlayer: createMockPlayer({ name: "Test Player" }),
    onScoreSubmit: vi.fn(),
    onPenalty: vi.fn(),
  };

  return render(
    h(GameProvider, null, h(ScoreInput, { ...defaultProps, ...props }))
  );
}

describe("ScoreInput Component - New Interface", () => {
  describe("Pin Selection Interface", () => {
    it("should render pin selection buttons 1-12", () => {
      renderScoreInput();

      // Check that all pin buttons are rendered
      for (let i = 1; i <= 12; i++) {
        expect(
          screen.getByRole("button", { name: i.toString() })
        ).toBeInTheDocument();
      }
    });

    it("should render miss button", () => {
      renderScoreInput();
      expect(
        screen.getByRole("button", { name: "Miss (0 points)" })
      ).toBeInTheDocument();
    });

    it("should render submit button", () => {
      renderScoreInput();
      expect(
        screen.getByRole("button", { name: "Submit score" })
      ).toBeInTheDocument();
    });

    it("should show calculated score display", () => {
      renderScoreInput();
      expect(screen.getByText(/Calculated Score:/)).toBeInTheDocument();
    });
  });

  describe("Single Pin Selection", () => {
    it("should select and highlight a single pin", () => {
      renderScoreInput();

      const pin5 = screen.getByRole("button", { name: "5" });
      fireEvent.click(pin5);

      // Check if pin is selected (aria-pressed should be true)
      expect(pin5).toHaveAttribute("aria-pressed", "true");
    });

    it("should show correct calculated score for single pin", () => {
      renderScoreInput();

      const pin7 = screen.getByRole("button", { name: "7" });
      fireEvent.click(pin7);

      // Should show score of 7 for single pin
      expect(screen.getByText("Calculated Score:")).toBeInTheDocument();

      // Check the calculated score display specifically
      const scoreDisplay = screen.getByText("Calculated Score:").parentElement;
      expect(scoreDisplay).toHaveTextContent("Calculated Score: 7");
      expect(scoreDisplay).toHaveTextContent("Single Pin: 7");
    });

    it("should deselect pin when clicked again", () => {
      renderScoreInput();

      const pin3 = screen.getByRole("button", { name: "3" });

      // Select pin
      fireEvent.click(pin3);
      expect(pin3).toHaveAttribute("aria-pressed", "true");

      // Deselect pin
      fireEvent.click(pin3);
      expect(pin3).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("Multiple Pin Selection", () => {
    it("should select multiple pins", () => {
      renderScoreInput();

      const pin2 = screen.getByRole("button", { name: "2" });
      const pin5 = screen.getByRole("button", { name: "5" });
      const pin8 = screen.getByRole("button", { name: "8" });

      fireEvent.click(pin2);
      fireEvent.click(pin5);
      fireEvent.click(pin8);

      expect(pin2).toHaveAttribute("aria-pressed", "true");
      expect(pin5).toHaveAttribute("aria-pressed", "true");
      expect(pin8).toHaveAttribute("aria-pressed", "true");
    });

    it("should show correct calculated score for multiple pins", () => {
      renderScoreInput();

      // Select 4 pins
      fireEvent.click(screen.getByRole("button", { name: "1" }));
      fireEvent.click(screen.getByRole("button", { name: "4" }));
      fireEvent.click(screen.getByRole("button", { name: "7" }));
      fireEvent.click(screen.getByRole("button", { name: "10" }));

      // Should show score of 4 for multiple pins
      expect(screen.getByText("Calculated Score:")).toBeInTheDocument();

      // Check the calculated score display specifically
      const scoreDisplay = screen.getByText("Calculated Score:").parentElement;
      expect(scoreDisplay).toHaveTextContent("Calculated Score: 4");
      expect(scoreDisplay).toHaveTextContent("Multiple Pins: 4");
    });
  });

  describe("Score Submission", () => {
    it("should call onScoreSubmit with correct parameters for single pin", () => {
      const mockOnScoreSubmit = vi.fn();
      const player = createMockPlayer({ id: "test-player" });

      renderScoreInput({
        currentPlayer: player,
        onScoreSubmit: mockOnScoreSubmit,
      });

      // Select pin 6
      fireEvent.click(screen.getByRole("button", { name: "6" }));

      // Submit score
      fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

      expect(mockOnScoreSubmit).toHaveBeenCalledWith(
        "test-player",
        6,
        "single"
      );
    });

    it("should call onScoreSubmit with correct parameters for multiple pins", () => {
      const mockOnScoreSubmit = vi.fn();
      const player = createMockPlayer({ id: "test-player" });

      renderScoreInput({
        currentPlayer: player,
        onScoreSubmit: mockOnScoreSubmit,
      });

      // Select 3 pins
      fireEvent.click(screen.getByRole("button", { name: "2" }));
      fireEvent.click(screen.getByRole("button", { name: "5" }));
      fireEvent.click(screen.getByRole("button", { name: "9" }));

      // Submit score
      fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

      expect(mockOnScoreSubmit).toHaveBeenCalledWith(
        "test-player",
        3,
        "multiple"
      );
    });

    it("should handle miss submission", () => {
      const mockOnScoreSubmit = vi.fn();
      const player = createMockPlayer({ id: "test-player" });

      renderScoreInput({
        currentPlayer: player,
        onScoreSubmit: mockOnScoreSubmit,
      });

      // Click miss button
      fireEvent.click(screen.getByRole("button", { name: "Miss (0 points)" }));

      expect(mockOnScoreSubmit).toHaveBeenCalledWith(
        "test-player",
        0,
        "single"
      );
    });

    it("should clear selection after submission", () => {
      const mockOnScoreSubmit = vi.fn();

      renderScoreInput({
        onScoreSubmit: mockOnScoreSubmit,
      });

      // Select a pin
      const pin4 = screen.getByRole("button", { name: "4" });
      fireEvent.click(pin4);
      expect(pin4).toHaveAttribute("aria-pressed", "true");

      // Submit score
      fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

      // Pin should be deselected after submission
      expect(pin4).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("Penalty Functionality", () => {
    it("should render penalty section", () => {
      renderScoreInput();

      expect(screen.getByText("Penalty")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Apply Penalty" })
      ).toBeInTheDocument();
    });

    it("should show penalty confirmation modal", () => {
      renderScoreInput();

      fireEvent.click(screen.getByRole("button", { name: "Apply Penalty" }));

      expect(
        screen.getByRole("heading", { name: "Confirm Penalty" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(screen.getAllByText("Confirm Penalty")).toHaveLength(2); // heading and button
    });

    it("should call onPenalty when confirmed", () => {
      const mockOnPenalty = vi.fn();
      const player = createMockPlayer({ id: "test-player" });

      renderScoreInput({
        currentPlayer: player,
        onPenalty: mockOnPenalty,
      });

      // Open penalty modal
      fireEvent.click(screen.getByRole("button", { name: "Apply Penalty" }));

      // Confirm penalty
      fireEvent.click(screen.getByRole("button", { name: "Confirm Penalty" }));

      expect(mockOnPenalty).toHaveBeenCalledWith(
        "test-player",
        "Rule violation"
      );
    });
  });

  describe("Eliminated Player", () => {
    it("should show elimination message for eliminated player", () => {
      const eliminatedPlayer = createMockPlayer({
        name: "Eliminated Player",
        eliminated: true,
      });

      renderScoreInput({ currentPlayer: eliminatedPlayer });

      expect(
        screen.getByText(/Eliminated Player has been eliminated/)
      ).toBeInTheDocument();
    });

    it("should not show score input for eliminated player", () => {
      const eliminatedPlayer = createMockPlayer({ eliminated: true });

      renderScoreInput({ currentPlayer: eliminatedPlayer });

      expect(
        screen.queryByText("Select Pins Knocked Down")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Submit score" })
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on pin buttons", () => {
      renderScoreInput();

      const pin1 = screen.getByRole("button", { name: "1" });
      expect(pin1).toHaveAttribute("aria-pressed", "false");
      expect(pin1).toHaveAttribute("type", "button");
    });

    it("should have proper labels on action buttons", () => {
      renderScoreInput();

      expect(
        screen.getByRole("button", { name: "Submit score" })
      ).toHaveAttribute("aria-label", "Submit score");
      expect(
        screen.getByRole("button", { name: "Mark out-of-turn throw" })
      ).toHaveAttribute("aria-label", "Mark out-of-turn throw");
    });

    it("should have proper error display with ARIA live region", () => {
      renderScoreInput();

      // This would need to be tested with actual error conditions
      // For now, just verify the structure exists
      expect(screen.getByText("Select Pins Knocked Down")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive classes", () => {
      renderScoreInput();

      const pinGrid = screen.getByText("1").closest(".grid");
      expect(pinGrid).toHaveClass("grid-cols-6");
    });

    it("should have touch-friendly button sizes", () => {
      renderScoreInput();

      const pin1 = screen.getByRole("button", { name: "1" });
      expect(pin1).toHaveClass("w-12", "h-12", "touch-manipulation");
    });
  });
});

describe("Integration with Game Context", () => {
  it("should dispatch actions when no callback props provided", () => {
    // This test would require mocking the GameContext
    // For now, just verify the component renders without callbacks
    const player = createMockPlayer();

    render(h(GameProvider, null, h(ScoreInput, { currentPlayer: player })));

    expect(
      screen.getByRole("button", { name: "Submit score" })
    ).toBeInTheDocument();
  });
});
