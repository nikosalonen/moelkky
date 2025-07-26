/**
 * ScoreInput Component Tests
 * Tests all score input scenarios, validation, and penalty functionality
 *
 * @format
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ScoreInput } from "../../src/components/ScoreInput/ScoreInput";
import { GameProvider } from "../../src/context/GameContext";
import { ToastProvider } from "../../src/components/Toast/Toast";
import type { Player } from "../../src/utils/types";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import React from "preact/compat";
// Helper function to render component with context
const renderWithContext = (props: any) => {
  return render(
    <GameProvider>
      <ToastProvider>
        <ScoreInput {...props} />
      </ToastProvider>
    </GameProvider>
  );
};

// Sample player for testing
const samplePlayer: Player = {
  id: "player1",
  name: "Alice",
  score: 15,
  penalties: 0,
  isActive: true,
  eliminated: false,
};

describe("ScoreInput Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("should render the component with title", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(screen.getByText("Score Entry")).toBeInTheDocument();
    });

    it("should display current player information", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(screen.getByText("Current Player")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Current Score: 15 / 50")).toBeInTheDocument();
      expect(screen.getByText("Points Needed: 35")).toBeInTheDocument();
    });

    it("should default to single pin input method", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const singlePinButton = screen.getByText("Single Pin (1-12)");
      expect(singlePinButton).toHaveClass("bg-blue-500");
    });

    it("should show correct number buttons for single pin method", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      // Should show buttons 1-12 for single pin
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });
  });

  describe("Input Method Selection", () => {
    it("should switch to multiple pin method when clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      expect(multiplePinButton).toHaveClass("bg-blue-500");
      expect(screen.getByText("Single Pin (1-12)")).not.toHaveClass(
        "bg-blue-500"
      );
    });

    it("should show correct number buttons for multiple pin method", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      // Button 1 should be disabled for multiple pin method
      const button1 = screen.getByText("1");
      expect(button1).toBeDisabled();
      
      // Buttons 2-12 should be enabled
      expect(screen.getByText("2")).not.toBeDisabled();
      expect(screen.getByText("12")).not.toBeDisabled();
    });

    it("should update input placeholder when switching methods", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      expect(input).toBeInTheDocument();

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      expect(screen.getByPlaceholderText("Enter score (2-12)")).toBeInTheDocument();
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

    it("should disable pin 1 for multiple pin method", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      const pin1 = screen.getByText("1");
      expect(pin1).toBeDisabled();
    });
  });

  describe("Manual Input", () => {
    it("should handle manual input changes", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)") as HTMLInputElement;
      fireEvent.input(input, { target: { value: "8" } });

      expect(input.value).toBe("8");
    });

    it("should clear selected pins when manual input is used", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const pin5 = screen.getByText("5");
      fireEvent.click(pin5);
      expect(pin5).toHaveClass("bg-blue-500");

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      fireEvent.input(input, { target: { value: "8" } });

      expect(pin5).not.toHaveClass("bg-blue-500");
    });

    it("should clear manual input when pins are selected", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)") as HTMLInputElement;
      fireEvent.input(input, { target: { value: "8" } });
      expect(input.value).toBe("8");

      const pin5 = screen.getByText("5");
      fireEvent.click(pin5);

      expect(input.value).toBe("");
    });
  });

  describe("Score Validation", () => {
    it("should show error for invalid single pin score (too high)", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "15" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Single pin score must be between 0 and 12")
        ).toBeInTheDocument();
      });
    });

    it("should show error for invalid multiple pin score (too high)", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      const input = screen.getByPlaceholderText("Enter score (2-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "15" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Multiple pin score must be between 2 and 12")
        ).toBeInTheDocument();
      });
    });

    it("should show error for invalid multiple pin score (too low)", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      const input = screen.getByPlaceholderText("Enter score (2-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "1" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Multiple pin score must be between 2 and 12")
        ).toBeInTheDocument();
      });
    });

    it("should clear input after successful score submission", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const input = screen.getByPlaceholderText(
        "Enter score (1-12)"
      ) as HTMLInputElement;
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "5" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });

  describe("Score Submission", () => {
    it("should call onScoreSubmit callback with correct parameters", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "8" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 8, "single");
      });
    });

    it("should call onScoreSubmit with multiple pin type when appropriate", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      const input = screen.getByPlaceholderText("Enter score (2-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "5" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 5, "multiple");
      });
    });

    it("should show submitting state during score submission", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "3" } });
      fireEvent.click(submitButton);

      expect(screen.getByText("Submitting...")).toBeInTheDocument();
    });

    it("should disable all inputs during submission", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");
      const singlePinButton = screen.getByText("Single Pin (1-12)");

      fireEvent.input(input, { target: { value: "4" } });
      fireEvent.click(submitButton);

      expect(input).toBeDisabled();
      expect(singlePinButton).toBeDisabled();
    });

    it("should submit score using pin selection", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const pin5 = screen.getByText("5");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.click(pin5);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 5, "single");
      });
    });

    it("should submit multiple pin score using pin selection", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      const pin3 = screen.getByText("3");
      const pin7 = screen.getByText("7");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.click(pin3);
      fireEvent.click(pin7);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 2, "multiple");
      });
    });
  });

  describe("Penalty Functionality", () => {
    it("should show penalty section", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(screen.getByText("Penalty")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Apply a penalty to reset the player's score to 25 points."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Apply Penalty")).toBeInTheDocument();
    });

    it("should show penalty confirmation dialog when penalty button is clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const penaltyButton = screen.getByText("Apply Penalty");
      fireEvent.click(penaltyButton);

      expect(screen.getByText("Confirm Penalty")).toBeInTheDocument();
      expect(
        screen.getByText(
          `Are you sure you want to apply a penalty to ${samplePlayer.name}? This will reset their score to 25 points.`
        )
      ).toBeInTheDocument();
    });

    it("should call onPenalty callback when penalty is confirmed", async () => {
      const mockOnPenalty = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onPenalty: mockOnPenalty,
      });

      const penaltyButton = screen.getByText("Apply Penalty");
      fireEvent.click(penaltyButton);

      const confirmButton = screen.getByText("Apply");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnPenalty).toHaveBeenCalledWith("player1", "Rule violation");
      });
    });

    it("should close penalty dialog when cancel is clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const penaltyButton = screen.getByText("Apply Penalty");
      fireEvent.click(penaltyButton);

      expect(screen.getByText("Confirm Penalty")).toBeInTheDocument();

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Confirm Penalty")).not.toBeInTheDocument();
    });
  });

  describe("Miss Functionality", () => {
    it("should handle miss button click", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const missButton = screen.getByText("Miss (0 points)");
      fireEvent.click(missButton);

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 0, "single");
      });
    });

    it("should clear inputs when miss is submitted", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const pin5 = screen.getByText("5");
      fireEvent.click(pin5);

      const missButton = screen.getByText("Miss (0 points)");
      fireEvent.click(missButton);

      await waitFor(() => {
        expect(pin5).not.toHaveClass("bg-blue-500");
      });
    });
  });

  describe("Out-of-Turn Throw", () => {
    it("should handle out-of-turn throw button click", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const outOfTurnButton = screen.getByText("Mark Out-of-Turn Throw");
      fireEvent.click(outOfTurnButton);

      // Should not throw an error and should dispatch the action
      expect(outOfTurnButton).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should clear error when switching input methods", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      // Create an error
      fireEvent.input(input, { target: { value: "15" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Single pin score must be between 0 and 12")).toBeInTheDocument();
      });

      // Switch input method
      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      // Error should be cleared
      expect(screen.queryByText("Single pin score must be between 0 and 12")).not.toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should render with responsive classes", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const container = screen.getByText("Score Entry").closest("div");
      expect(container).toBeInTheDocument();
    });

    it("should have responsive grid for number buttons", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const numberButtonContainer = screen
        .getByText("1")
        .closest(".grid") as HTMLElement;
      expect(numberButtonContainer).toHaveClass("grid", "grid-cols-6");
    });

    it("should have responsive flex layout for input method buttons", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const methodButtonContainer = screen
        .getByText("Single Pin (1-12)")
        .closest(".flex") as HTMLElement;
      expect(methodButtonContainer).toHaveClass("flex", "space-x-2");
    });
  });

  describe("Eliminated Player", () => {
    it("should show eliminated message for eliminated player", () => {
      const eliminatedPlayer = { ...samplePlayer, eliminated: true };
      renderWithContext({ currentPlayer: eliminatedPlayer });

      expect(screen.getByText(/has been eliminated and cannot play further turns/)).toBeInTheDocument();
    });
  });
});
