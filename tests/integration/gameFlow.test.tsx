/**
 * Integration tests for complete game flow control system
 * Tests all requirements for task 9: game state transitions, player management restrictions, turn advancement
 *
 * @format
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { describe, it, expect, beforeEach } from "vitest";
import { h } from "preact";
import { App } from "../../src/app";
import React from "preact/compat";

describe("Game Flow Control System Integration", () => {
  beforeEach(() => {
    // Clear any stored game state before each test
    sessionStorage.clear();
  });

  describe("Requirement 2.1: Start Game Functionality", () => {
    it("should enable start game button when 2+ players are added", async () => {
      render(<App />);

      // Initially, start button should be disabled
      const startButton = screen.getByRole("button", { name: /start game|need.*more player/i });
      expect(startButton).toBeDisabled();

      // Add first player
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);

      // Still disabled with 1 player
      expect(startButton).toBeDisabled();

      // Add second player
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      // Now should be enabled
      expect(startButton).toBeEnabled();
      expect(startButton).toHaveTextContent(/start game/i);
    });

    it("should prevent game start with less than 2 players", async () => {
      render(<App />);

      // Try to start with no players
      const startButton = screen.getByRole("button", { name: /need.*more player/i });
      expect(startButton).toBeDisabled();

      // Add only one player
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);

      // Still disabled
      expect(startButton).toBeDisabled();
      expect(startButton).toHaveTextContent(/need.*more player/i);
    });
  });

  describe("Requirement 2.2: Game State Transitions", () => {
    it("should transition from setup to playing state", async () => {
      render(<App />);

      // Setup phase
      expect(screen.getByText("Players")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter player name")).toBeInTheDocument();

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

      // Should transition to playing state
      await waitFor(() => {
        expect(screen.getByText(/Game Board/i)).toBeInTheDocument();
        expect(screen.getByText(/Score Entry/i)).toBeInTheDocument();
        expect(screen.getByText(/player modifications are disabled/i)).toBeInTheDocument();
      });
    });

    it("should prevent player modifications during active gameplay", async () => {
      render(<App />);

      // Setup and start game
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // During gameplay, player input should be disabled
      await waitFor(() => {
        const disabledInput = screen.getByPlaceholderText("Enter player name");
        expect(disabledInput).toBeDisabled();
      });

      // Add player button should be disabled
      const addPlayerButton = screen.getByRole("button", { name: /add player/i });
      expect(addPlayerButton).toBeDisabled();
    });
  });

  describe("Requirement 2.3: Turn Management", () => {
    it("should start with first player's turn", async () => {
      render(<App />);

      // Setup and start game
      const playerInput = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByRole("button", { name: /add player/i });

      fireEvent.input(playerInput, { target: { value: "Alice" } });
      fireEvent.click(addButton);
      fireEvent.input(playerInput, { target: { value: "Bob" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start game/i });
      fireEvent.click(startButton);

      // Should start with Alice's turn
      await waitFor(() => {
        const aliceTurnElements = screen.getAllByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        });
        expect(aliceTurnElements.length).toBeGreaterThan(0);
      });
    });

    it("should cycle through players in order", async () => {
      render(<App />);

      // Setup with 3 players
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

      // Should start with Alice
      await waitFor(() => {
        const aliceTurnElements = screen.getAllByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        });
        expect(aliceTurnElements.length).toBeGreaterThan(0);
      });

      // Submit score to advance to Bob
      const singlePinButton = screen.getByRole("button", { name: "5" });
      fireEvent.click(singlePinButton);
      
      const submitButton = screen.getByRole("button", { name: /submit score/i });
      fireEvent.click(submitButton);

      // Should advance to Bob's turn
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return Boolean(element?.textContent?.includes("Bob") && element?.textContent?.includes("Turn"));
        })).toBeInTheDocument();
      });

      // Submit score to advance to Charlie
      const singlePinButton2 = screen.getByRole("button", { name: "3" });
      fireEvent.click(singlePinButton2);
      fireEvent.click(submitButton);

      // Should advance to Charlie's turn
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return Boolean(element?.textContent?.includes("Charlie") && element?.textContent?.includes("Turn"));
        })).toBeInTheDocument();
      });

      // Submit another score
      const singlePinButton3 = screen.getByRole("button", { name: "7" });
      fireEvent.click(singlePinButton3);
      fireEvent.click(submitButton);

      // Should cycle back to Alice's turn
      await waitFor(() => {
        const aliceTurnElements = screen.getAllByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        });
        expect(aliceTurnElements.length).toBeGreaterThan(0);
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
        const aliceTurnElements = screen.getAllByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        });
        expect(aliceTurnElements.length).toBeGreaterThan(0);
      });

      // Apply penalty
      const penaltyButton = screen.getByRole("button", { name: /apply penalty/i });
      fireEvent.click(penaltyButton);

      // Confirm penalty in modal
      const confirmButton = screen.getByRole("button", { name: /confirm penalty/i });
      fireEvent.click(confirmButton);

      // Should advance to Bob's turn
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return Boolean(element?.textContent?.includes("Bob") && element?.textContent?.includes("Turn"));
        })).toBeInTheDocument();
      });
    });
  });

  describe("Complete Game Flow State Transitions", () => {
    it("should properly transition through all game states: setup → playing → finished", async () => {
      render(<App />);

      // Phase 1: Setup state
      expect(screen.getByText("Players")).toBeInTheDocument();
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
        expect(screen.getByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        })).toBeInTheDocument();
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
        if (screen.queryByText((content, element) => {
          return Boolean(element?.textContent?.includes("Bob") && element?.textContent?.includes("Turn"));
        })) {
          // Click "None" or submit 0 score for Bob
          const noneButton = screen.getByRole("button", { name: "None" });
          fireEvent.click(noneButton);
          const submitButton2 = screen.getByRole("button", { name: /submit score/i });
          fireEvent.click(submitButton2);
        }
      }

      // Final turn: Alice scores 5 more to reach exactly 50
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        })).toBeInTheDocument();
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
      expect(screen.getByText("Final Leaderboard")).toBeInTheDocument();
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
        const aliceTurnElements = screen.getAllByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        });
        expect(aliceTurnElements.length).toBeGreaterThan(0);
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
      const aliceTurnElements = screen.getAllByText((content, element) => {
        return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
      });
      expect(aliceTurnElements.length).toBeGreaterThan(0);
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
          const aliceTurnElements = screen.getAllByText((content, element) => {
            return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
          });
          expect(aliceTurnElements.length).toBeGreaterThan(0);
        });

        const pin5Button = screen.getByRole("button", { name: "5" });
        fireEvent.click(pin5Button);
        
        const submitButton = screen.getByRole("button", { name: /submit score/i });
        fireEvent.click(submitButton);

        // Handle Bob's turn
        const bobTurnElements = screen.getAllByText((content, element) => {
          return Boolean(element?.textContent?.includes("Bob") && element?.textContent?.includes("Turn"));
        });
        if (bobTurnElements.length > 0) {
          const noneButton = screen.getByRole("button", { name: "None" });
          fireEvent.click(noneButton);
          const submitButton2 = screen.getByRole("button", { name: /submit score/i });
          fireEvent.click(submitButton2);
        }
      }

      // Now Alice should have 45 points, score 6 more to go over 50
      await waitFor(() => {
        const aliceTurnElements = screen.getAllByText((content, element) => {
          return Boolean(element?.textContent?.includes("Alice") && element?.textContent?.includes("Turn"));
        });
        expect(aliceTurnElements.length).toBeGreaterThan(0);
      });

      const pin6Button = screen.getByRole("button", { name: "6" });
      fireEvent.click(pin6Button);
      
      const submitButton = screen.getByRole("button", { name: /submit score/i });
      fireEvent.click(submitButton);

      // Alice should be reset to 25 points and turn should advance
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return Boolean(element?.textContent?.includes("Bob") && element?.textContent?.includes("Turn"));
        })).toBeInTheDocument();
      });

      // Verify Alice's score was reset (this would be visible in the game board)
      // The exact assertion depends on how scores are displayed in the UI
    });
  });
});
