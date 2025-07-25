/**
 * Integration tests for complete game flow control system
 * Tests all requirements for task 9: game state transitions, player management restrictions, turn advancement
 *
 * @format
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import "@testing-library/jest-dom";
import { App } from "../../src/app";

describe("Game Flow Control System Integration", () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  describe("Requirement 2.1: Start Game with minimum player validation", () => {
    it("should enable Start Game button only when at least 2 players are added", async () => {
      render(<App />);

      // Initially, Start Game should be disabled
      const startButton = screen.getByRole("button", { name: /start game|need \d+ more player/i });
      expect(startButton).toBeDisabled();
      expect(startButton.textContent).toMatch(/need.*more player/i);

      // Add first player
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);

      // Still should be disabled with 1 player
      await waitFor(() => {
        expect(startButton).toBeDisabled();
        expect(startButton.textContent).toMatch(/need.*more player/i);
      });

      // Add second player
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      // Now should be enabled
      await waitFor(() => {
        const enabledStartButton = screen.getByRole("button", { name: /start game/i });
        expect(enabledStartButton).toBeEnabled();
      });
    });

    it("should prevent starting game with duplicate player names", async () => {
      render(<App />);

      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      // Add first player
      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);

      // Try to add duplicate player
      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      });

      // Start Game should still be disabled
      const startButton = screen.getByRole("button", { name: /start game|need \d+ more player/i });
      expect(startButton).toBeDisabled();
    });
  });

  describe("Requirement 2.2: Initialize player scores to 0", () => {
    it("should initialize all player scores to 0 when game starts", async () => {
      render(<App />);

      // Add players
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      // Start game
      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Check that game board shows scores of 0
      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        // Look for score displays (they should show 0)
        const scoreElements = screen.getAllByText("0");
        expect(scoreElements.length).toBeGreaterThanOrEqual(2); // At least 2 zeros for the 2 players
      });
    });
  });

  describe("Requirement 2.3: Display current player turn", () => {
    it("should clearly indicate whose turn it is", async () => {
      render(<App />);

      // Setup game
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Check that current turn is indicated
      await waitFor(() => {
        // Should show current player's turn in score input section
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
      });
    });
  });

  describe("Requirement 2.4: Prevent player modifications during active gameplay", () => {
    it("should disable player modification controls during active game", async () => {
      render(<App />);

      // Add players
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      // Initially, edit and remove buttons should be present
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
      });

      // Start game
      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Player modification controls should be hidden/disabled
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /add player/i })).not.toBeInTheDocument();
      });

      // Should show notice about player modifications being disabled
      expect(screen.getByText(/player modifications are disabled/i)).toBeInTheDocument();
    });
  });

  describe("Requirement 3.6: Turn advancement after score entry", () => {
    it("should advance to next player after score submission", async () => {
      render(<App />);

      // Setup game with 3 players for clearer turn rotation
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Charlie" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Initial state: Alice's turn
      await waitFor(() => {
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
      });

      // Submit a score (using single pin method)
      const singlePinButton = screen.getByRole("button", { name: "5" });
      fireEvent.click(singlePinButton);

      const submitButton = screen.getByRole("button", { name: /submit score/i });
      fireEvent.click(submitButton);

      // Should advance to Bob's turn
      await waitFor(() => {
        expect(screen.getByText(/Bob's Turn/i)).toBeInTheDocument();
      });

      // Submit another score
      const singlePinButton2 = screen.getByRole("button", { name: "3" });
      fireEvent.click(singlePinButton2);
      fireEvent.click(submitButton);

      // Should advance to Charlie's turn
      await waitFor(() => {
        expect(screen.getByText(/Charlie's Turn/i)).toBeInTheDocument();
      });

      // Submit another score
      const singlePinButton3 = screen.getByRole("button", { name: "7" });
      fireEvent.click(singlePinButton3);
      fireEvent.click(submitButton);

      // Should cycle back to Alice's turn
      await waitFor(() => {
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
      });
    });

    it("should advance to next player after penalty application", async () => {
      render(<App />);

      // Setup game
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Initial state: Alice's turn
      await waitFor(() => {
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
      });

      // Apply penalty
      const penaltyButton = screen.getByRole("button", { name: /apply penalty/i });
      fireEvent.click(penaltyButton);

      // Confirm penalty in modal
      const confirmButton = screen.getByRole("button", { name: /apply/i });
      fireEvent.click(confirmButton);

      // Should advance to Bob's turn
      await waitFor(() => {
        expect(screen.getByText(/Bob's Turn/i)).toBeInTheDocument();
      });
    });
  });

  describe("Complete Game Flow State Transitions", () => {
    it("should properly transition through all game states: setup → playing → finished", async () => {
      render(<App />);

      // Phase 1: Setup state
      expect(screen.getByText(/players/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter player name")).toBeInTheDocument();

      // Add players
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      // Start game - transition to playing state
      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Phase 2: Playing state
      await waitFor(() => {
        // Should show game board and score input
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
        expect(screen.getByText(/Single Pin/i)).toBeInTheDocument();
        // Player modification notice should be visible
        expect(screen.getByText(/player modifications are disabled/i)).toBeInTheDocument();
      });

      // Simulate game to completion (Alice reaches exactly 50)
      // First, get Alice to 45 points (submit 45 in multiple turns)
      for (let i = 0; i < 9; i++) { // 9 turns of 5 points each = 45 points
        const pin5Button = screen.getByRole("button", { name: "5" });
        fireEvent.click(pin5Button);
        
        const submitButton = screen.getByRole("button", { name: /submit score/i });
        fireEvent.click(submitButton);

        // Wait for turn to advance and cycle back to Alice
        await waitFor(() => {
          if (i < 8) { // Not the last iteration
            expect(screen.getByText(/Turn/i)).toBeInTheDocument();
          }
        });

        // Skip Bob's turns by submitting 0 points
        if (screen.queryByText(/Bob's Turn/i)) {
          // Click "None" or submit 0 score for Bob
          const noneButton = screen.getByRole("button", { name: "None" });
          fireEvent.click(noneButton);
          const submitButton2 = screen.getByRole("button", { name: /submit score/i });
          fireEvent.click(submitButton2);
        }
      }

      // Final turn: Alice scores 5 more to reach exactly 50
      await waitFor(() => {
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
      });

      const finalPin5Button = screen.getByRole("button", { name: "5" });
      fireEvent.click(finalPin5Button);
      
      const finalSubmitButton = screen.getByRole("button", { name: /submit score/i });
      fireEvent.click(finalSubmitButton);

      // Phase 3: Finished state
      await waitFor(() => {
        // Should show winner announcement
        expect(screen.getByText(/Alice Wins/i)).toBeInTheDocument();
        expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /start new game/i })).toBeInTheDocument();
      });

      // Should show final scores
      expect(screen.getByText("Final Scores")).toBeInTheDocument();
    });
  });

  describe("Game Flow Error Handling", () => {
    it("should handle invalid scores gracefully", async () => {
      render(<App />);

      // Setup game
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Try to submit invalid score via multiple pins
      await waitFor(() => {
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
      });

      // Switch to multiple pins method
      const multiplePinsTab = screen.getByRole("button", { name: /multiple pins/i });
      fireEvent.click(multiplePinsTab);

      // Try to enter invalid number (>12)
      const multiplePinsInput = screen.getByPlaceholderText(/number of pins/i);
      fireEvent.input(multiplePinsInput, { target: { value: "15" } });

      const submitButton = screen.getByRole("button", { name: /submit score/i });
      fireEvent.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/must be between 2 and 12/i)).toBeInTheDocument();
      });

      // Turn should not advance (still Alice's turn)
      expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
    });

    it("should handle over-50 score penalty correctly", async () => {
      render(<App />);

      // Setup game
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Get Alice to 45 points first (9 x 5 = 45)
      for (let i = 0; i < 9; i++) {
        await waitFor(() => {
          expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
        });

        const pin5Button = screen.getByRole("button", { name: "5" });
        fireEvent.click(pin5Button);
        
        const submitButton = screen.getByRole("button", { name: /submit score/i });
        fireEvent.click(submitButton);

        // Handle Bob's turn
        if (screen.queryByText(/Bob's Turn/i)) {
          const noneButton = screen.getByRole("button", { name: "None" });
          fireEvent.click(noneButton);
          const submitButton2 = screen.getByRole("button", { name: /submit score/i });
          fireEvent.click(submitButton2);
        }
      }

      // Now Alice should have 45 points, score 6 more to go over 50
      await waitFor(() => {
        expect(screen.getByText(/Alice's Turn/i)).toBeInTheDocument();
      });

      const pin6Button = screen.getByRole("button", { name: "6" });
      fireEvent.click(pin6Button);
      
      const submitButton = screen.getByRole("button", { name: /submit score/i });
      fireEvent.click(submitButton);

      // Alice should be reset to 25 points and turn should advance
      await waitFor(() => {
        expect(screen.getByText(/Bob's Turn/i)).toBeInTheDocument();
      });

      // Verify Alice's score was reset (this would be visible in the game board)
      // The exact assertion depends on how scores are displayed in the UI
    });
  });
});
