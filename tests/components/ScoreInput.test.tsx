/**
 * @format
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { h } from "preact";
import { ScoreInput } from "../../src/components/ScoreInput/ScoreInput";
import { GameProvider } from "../../src/context/GameContext";
import { ToastProvider } from "../../src/components/Toast";
import type { Player } from "../../src/utils/types";

// Mock the LoadingSpinner component
vi.mock("../../src/components/LoadingSpinner", () => ({
  InlineSpinner: ({ size, variant }: { size: string; variant: string }) => 
    h("div", { 
      "data-testid": "loading-spinner", 
      "data-size": size, 
      "data-variant": variant 
    }, "Loading...")
}));

const samplePlayer: Player = {
  id: "player1",
  name: "Test Player",
  score: 25,
  penalties: 0,
  isActive: true,
  eliminated: false,
  consecutiveMisses: 0,
};

const renderWithContext = (props: any) => {
  return render(
    h(ToastProvider, null,
      h(GameProvider, null,
        h(ScoreInput, props)
      )
    )
  );
};

describe("ScoreInput Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the component with current player info", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(screen.getByText("Score Entry")).toBeInTheDocument();
      expect(screen.getByText("Test Player")).toBeInTheDocument();
      expect(screen.getByText("Current Score: 25 / 50")).toBeInTheDocument();
      expect(screen.getByText("Points Needed: 25")).toBeInTheDocument();
    });

    it("should render pin selection buttons", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      // Should show buttons 1-12
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("should show eliminated message for eliminated player", () => {
      const eliminatedPlayer = { ...samplePlayer, eliminated: true };
      renderWithContext({ currentPlayer: eliminatedPlayer });

      expect(
        screen.getByText(/has been eliminated and cannot play further turns/)
      ).toBeInTheDocument();
    });
  });

  describe("Pin Selection", () => {
    it("should select pins when clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const pin5 = screen.getByText("5");
      fireEvent.click(pin5);

      expect(pin5).toHaveClass("bg-blue-500");
      expect(pin5).toHaveAttribute("aria-pressed", "true");
    });

    it("should deselect pins when clicked again", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const pin5 = screen.getByText("5");
      fireEvent.click(pin5);
      fireEvent.click(pin5);

      expect(pin5).not.toHaveClass("bg-blue-500");
      expect(pin5).toHaveAttribute("aria-pressed", "false");
    });

    it("should allow multiple pin selection", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const pin3 = screen.getByText("3");
      const pin7 = screen.getByText("7");
      
      fireEvent.click(pin3);
      fireEvent.click(pin7);

      expect(pin3).toHaveClass("bg-blue-500");
      expect(pin7).toHaveClass("bg-blue-500");
    });

    it("should show correct instructions based on pin selection", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      // Initially should show "Click on the pins that were knocked down"
      expect(screen.getByText("Click on the pins that were knocked down")).toBeInTheDocument();

      // After selecting one pin
      fireEvent.click(screen.getByText("5"));
      expect(screen.getByText("Single pin selected: 5 points")).toBeInTheDocument();

      // After selecting multiple pins
      fireEvent.click(screen.getByText("7"));
      expect(screen.getByText("2 pins selected: 2 points")).toBeInTheDocument();
    });
  });

  describe("Score Calculation", () => {
    it("should calculate single pin score correctly", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      fireEvent.click(screen.getByText("8"));
      
      expect(screen.getByText(/Calculated Score:/)).toBeInTheDocument();
      expect(screen.getByText("Single Pin: 8")).toBeInTheDocument();
    });

    it("should calculate multiple pin score correctly", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      fireEvent.click(screen.getByText("3"));
      fireEvent.click(screen.getByText("6"));
      fireEvent.click(screen.getByText("9"));
      
      expect(screen.getByText(/Calculated Score:/)).toBeInTheDocument();
      expect(screen.getByText("Multiple Pins: 3")).toBeInTheDocument();
    });

    it("should show zero score when no pins selected", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(screen.getByText(/Calculated Score:/)).toBeInTheDocument();
    });
  });

  describe("Score Validation", () => {
    it("should validate single pin score correctly", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      // Valid single pin score
      fireEvent.click(screen.getByText("10"));
      fireEvent.click(screen.getByText("Submit Score"));

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 10, "single");
      });
    });

    it("should validate multiple pin score correctly", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      // Valid multiple pin score
      fireEvent.click(screen.getByText("2"));
      fireEvent.click(screen.getByText("4"));
      fireEvent.click(screen.getByText("6"));
      fireEvent.click(screen.getByText("Submit Score"));

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 3, "multiple");
      });
    });

    it("should clear selection after successful score submission", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const pin5 = screen.getByText("5");
      fireEvent.click(pin5);
      fireEvent.click(screen.getByText("Submit Score"));

      await waitFor(() => {
        expect(pin5).not.toHaveClass("bg-blue-500");
      });
    });
  });

  describe("Score Submission", () => {
    it("should call onScoreSubmit callback with correct parameters for single pin", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      fireEvent.click(screen.getByText("6"));
      fireEvent.click(screen.getByText("Submit Score"));

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 6, "single");
      });
    });

    it("should call onScoreSubmit with multiple pin type when appropriate", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      fireEvent.click(screen.getByText("2"));
      fireEvent.click(screen.getByText("5"));
      fireEvent.click(screen.getByText("Submit Score"));

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 2, "multiple");
      });
    });

    it("should handle miss submission", () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      fireEvent.click(screen.getByText("Miss (0 points)"));

      expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 0, "single");
    });

    it("should disable submit button when no pins selected", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const submitButton = screen.getByText("Submit Score");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when pins are selected", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      fireEvent.click(screen.getByText("5"));
      const submitButton = screen.getByText("Submit Score");
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Penalty Functionality", () => {
    it("should show penalty button", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(screen.getByText("Apply Penalty")).toBeInTheDocument();
    });

    it("should show penalty confirmation modal when clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      fireEvent.click(screen.getByText("Apply Penalty"));

      expect(screen.getByText("Confirm Penalty")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to apply a penalty/)
      ).toBeInTheDocument();
    });

    it("should call onPenalty callback when confirmed", async () => {
      const mockOnPenalty = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onPenalty: mockOnPenalty,
      });

      fireEvent.click(screen.getByText("Apply Penalty"));
      fireEvent.click(screen.getByText("Apply"));

      await waitFor(() => {
        expect(mockOnPenalty).toHaveBeenCalledWith("player1", "Rule violation");
      });
    });
  });

  describe("Out-of-Turn Functionality", () => {
    it("should show out-of-turn button", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(screen.getByText("Mark Out-of-Turn Throw")).toBeInTheDocument();
    });

    it("should handle out-of-turn throw", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      fireEvent.click(screen.getByText("Mark Out-of-Turn Throw"));

      // Should not throw an error
      expect(screen.getByText("Mark Out-of-Turn Throw")).toBeInTheDocument();
    });
  });
});

