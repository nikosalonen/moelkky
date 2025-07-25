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
import type { Player } from "../../src/utils/types";

// Mock session storage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

// Helper function to render component with context
const renderWithContext = (props: any) => {
  return render(
    <GameProvider>
      <ScoreInput {...props} />
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
};

describe("ScoreInput Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
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

      // Should not show button 1 for multiple pins
      expect(screen.queryByText("1")).not.toBeInTheDocument();
      // Should show buttons 2-12
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("should clear score value when switching methods", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText(
        "Enter score (1-12)"
      ) as HTMLInputElement;
      fireEvent.input(input, { target: { value: "5" } });
      expect(input.value).toBe("5");

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      const newInput = screen.getByPlaceholderText(
        "Enter score (2-12)"
      ) as HTMLInputElement;
      expect(newInput.value).toBe("");
    });

    it("should show correct placeholder text for each method", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(
        screen.getByPlaceholderText("Enter score (1-12)")
      ).toBeInTheDocument();

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      expect(
        screen.getByPlaceholderText("Enter score (2-12)")
      ).toBeInTheDocument();
    });

    it("should show correct helper text for each method", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      expect(
        screen.getByText(
          "Select the number on the single pin that was knocked down"
        )
      ).toBeInTheDocument();

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      expect(
        screen.getByText("Select the count of pins that were knocked down")
      ).toBeInTheDocument();
    });
  });

  describe("Number Button Input", () => {
    it("should set score value when number button is clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const button5 = screen.getByText("5");
      fireEvent.click(button5);

      const input = screen.getByPlaceholderText(
        "Enter score (1-12)"
      ) as HTMLInputElement;
      expect(input.value).toBe("5");
    });

    it("should update input field when different number buttons are clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const button3 = screen.getByText("3");
      const button8 = screen.getByText("8");
      const input = screen.getByPlaceholderText(
        "Enter score (1-12)"
      ) as HTMLInputElement;

      fireEvent.click(button3);
      expect(input.value).toBe("3");

      fireEvent.click(button8);
      expect(input.value).toBe("8");
    });

    it("should disable number buttons when submitting", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const button5 = screen.getByText("5");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.click(button5);
      fireEvent.click(submitButton);

      // Check that button is disabled during submission
      expect(button5).toBeDisabled();
    });
  });

  describe("Manual Input", () => {
    it("should accept manual score input", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText(
        "Enter score (1-12)"
      ) as HTMLInputElement;
      fireEvent.input(input, { target: { value: "7" } });

      expect(input.value).toBe("7");
    });

    it("should submit score when Enter key is pressed", async () => {
      const mockOnScoreSubmit = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onScoreSubmit: mockOnScoreSubmit,
      });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      fireEvent.input(input, { target: { value: "6" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 6);
      });
    });

    it("should enable submit button when input has value", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText(
        "Submit Score"
      ) as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);

      fireEvent.input(input, { target: { value: "4" } });
      expect(submitButton.disabled).toBe(false);
    });

    it("should disable submit button when input is empty", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText(
        "Submit Score"
      ) as HTMLButtonElement;

      fireEvent.input(input, { target: { value: "4" } });
      expect(submitButton.disabled).toBe(false);

      fireEvent.input(input, { target: { value: "" } });
      expect(submitButton.disabled).toBe(true);
    });
  });

  describe("Score Validation", () => {
    it("should show error for invalid single pin score (too low)", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "0" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Single pin score must be between 1 and 12")
        ).toBeInTheDocument();
      });
    });

    it("should show error for invalid single pin score (too high)", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "13" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Single pin score must be between 1 and 12")
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

    it("should show error for non-numeric input", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "abc" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid number")
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
        expect(mockOnScoreSubmit).toHaveBeenCalledWith("player1", 8);
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
        screen.getByText(/Are you sure you want to apply a penalty to/)
      ).toBeInTheDocument();
      expect(
        screen
          .getByText(/Are you sure you want to apply a penalty to/)
          .closest("div")
      ).toHaveTextContent("Alice");
    });

    it("should close penalty dialog when cancel is clicked", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const penaltyButton = screen.getByText("Apply Penalty");
      fireEvent.click(penaltyButton);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Confirm Penalty")).not.toBeInTheDocument();
    });

    it("should call onPenalty callback when penalty is confirmed", async () => {
      const mockOnPenalty = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onPenalty: mockOnPenalty,
      });

      const penaltyButton = screen.getByText("Apply Penalty");
      fireEvent.click(penaltyButton);

      // Find the confirm button in the modal
      const modal = screen.getByText("Confirm Penalty").closest("div");
      const confirmButton = modal?.querySelector(
        "button:last-child"
      ) as HTMLButtonElement;
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnPenalty).toHaveBeenCalledWith("player1", "Rule violation");
      });
    });

    it("should show applying state during penalty application", async () => {
      const mockOnPenalty = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onPenalty: mockOnPenalty,
      });

      const penaltyButton = screen.getByText("Apply Penalty");
      fireEvent.click(penaltyButton);

      const modal = screen.getByText("Confirm Penalty").closest("div");
      const confirmButton = modal?.querySelector(
        "button:last-child"
      ) as HTMLButtonElement;
      fireEvent.click(confirmButton);

      // The modal closes immediately, but we can check that the penalty button is disabled
      // and the main penalty button shows the loading state
      await waitFor(() => {
        expect(penaltyButton).toBeDisabled();
      });
    });

    it("should disable penalty button during submission", async () => {
      const mockOnPenalty = vi.fn();
      renderWithContext({
        currentPlayer: samplePlayer,
        onPenalty: mockOnPenalty,
      });

      const penaltyButton = screen.getByText("Apply Penalty");
      fireEvent.click(penaltyButton);

      const modal = screen.getByText("Confirm Penalty").closest("div");
      const confirmButton = modal?.querySelector(
        "button:last-child"
      ) as HTMLButtonElement;
      fireEvent.click(confirmButton);

      expect(penaltyButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display error messages with proper ARIA role", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "0" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.getByRole("alert");
        expect(errorElement).toBeInTheDocument();
      });
    });

    it("should clear error after timeout", async () => {
      vi.useFakeTimers();
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "0" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Single pin score must be between 1 and 12")
        ).toBeInTheDocument();
      });

      // Fast forward time
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(
          screen.queryByText("Single pin score must be between 1 and 12")
        ).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it("should clear error when switching input methods", async () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      fireEvent.input(input, { target: { value: "0" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Single pin score must be between 1 and 12")
        ).toBeInTheDocument();
      });

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      expect(
        screen.queryByText("Single pin score must be between 1 and 12")
      ).not.toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should render with responsive classes", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const container = screen.getByText("Score Entry").closest("div");
      expect(container).toHaveClass(
        "bg-white",
        "rounded-lg",
        "shadow-md",
        "p-6",
        "mb-6"
      );
    });

    it("should have responsive grid for number buttons", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const numberButtonContainer = screen
        .getByText("1")
        .closest(".grid") as HTMLElement;
      expect(numberButtonContainer).toHaveClass(
        "grid",
        "grid-cols-4",
        "sm:grid-cols-6",
        "md:grid-cols-8",
        "lg:grid-cols-12"
      );
    });

    it("should have responsive flex layout for input method buttons", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const methodButtonContainer = screen
        .getByText("Single Pin (1-12)")
        .closest(".flex") as HTMLElement;
      expect(methodButtonContainer).toHaveClass(
        "flex",
        "flex-col",
        "sm:flex-row"
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper focus management", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      const submitButton = screen.getByText("Submit Score");

      expect(input).toHaveAttribute("type", "number");
      expect(submitButton).toHaveAttribute("type", "button");
    });

    it("should have proper min and max attributes on input", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      expect(input).toHaveAttribute("min", "1");
      expect(input).toHaveAttribute("max", "12");

      const multiplePinButton = screen.getByText("Multiple Pins (2-12)");
      fireEvent.click(multiplePinButton);

      const multipleInput = screen.getByPlaceholderText("Enter score (2-12)");
      expect(multipleInput).toHaveAttribute("min", "2");
      expect(multipleInput).toHaveAttribute("max", "12");
    });

    it("should have proper button states and disabled attributes", () => {
      renderWithContext({ currentPlayer: samplePlayer });

      const submitButton = screen.getByText(
        "Submit Score"
      ) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);

      const input = screen.getByPlaceholderText("Enter score (1-12)");
      fireEvent.input(input, { target: { value: "5" } });

      expect(submitButton.disabled).toBe(false);
    });
  });
});
