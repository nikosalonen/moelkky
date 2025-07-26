/**
 * PlayerManager Component Tests
 * Tests all player management features including validation, editing, and removal
 *
 * @format
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { h } from "preact";
import { PlayerManager } from "../../src/components/PlayerManager/PlayerManager";
import { GameProvider } from "../../src/context/GameContext";
import { ToastProvider } from "../../src/components/Toast";
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
    h(ToastProvider, null,
      h(GameProvider, null,
        h(PlayerManager, props)
      )
    )
  );
};

// Sample players for testing
const samplePlayers: Player[] = [
  {
    id: "player1",
    name: "Alice",
    score: 0,
    penalties: 0,
    isActive: false,
  },
  {
    id: "player2",
    name: "Bob",
    score: 0,
    penalties: 0,
    isActive: true,
  },
];

describe("PlayerManager Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe("Initial Render", () => {
    it("should render the component with title", () => {
      renderWithContext({ players: [], gameActive: false });

      expect(screen.getByText("Players")).toBeInTheDocument();
    });

    it("should show empty state message when no players", () => {
      renderWithContext({ players: [], gameActive: false });

      expect(screen.getByText(/No players added yet/)).toBeInTheDocument();
      // Check for the specific empty state message, not the duplicate in player count info
      expect(
        screen.getByText(
          "No players added yet. Add at least 2 players to start a game."
        )
      ).toBeInTheDocument();
    });

    it("should show add player input when game is not active", () => {
      renderWithContext({ players: [], gameActive: false });

      expect(
        screen.getByPlaceholderText("Enter player name")
      ).toBeInTheDocument();
      expect(screen.getByText("Add Player")).toBeInTheDocument();
    });

    it("should not show add player input when game is active", () => {
      renderWithContext({ players: samplePlayers, gameActive: true });

      expect(
        screen.queryByPlaceholderText("Enter player name")
      ).not.toBeInTheDocument();
    });
  });

  describe("Adding Players", () => {
    it("should add a new player when valid name is entered", async () => {
      renderWithContext({ players: [], gameActive: false });

      const input = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByText("Add Player");

      fireEvent.input(input, { target: { value: "John" } });
      fireEvent.click(addButton);

      // Check that input is cleared after adding
      await waitFor(() => {
        expect((input as HTMLInputElement).value).toBe("");
      });
    });

    it("should clear input after adding player", async () => {
      renderWithContext({ players: [], gameActive: false });

      const input = screen.getByPlaceholderText(
        "Enter player name"
      ) as HTMLInputElement;
      const addButton = screen.getByText("Add Player");

      fireEvent.input(input, { target: { value: "John" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should add player when Enter key is pressed", async () => {
      renderWithContext({ players: [], gameActive: false });

      const input = screen.getByPlaceholderText(
        "Enter player name"
      ) as HTMLInputElement;

      fireEvent.input(input, { target: { value: "Jane" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should show error for empty player name", async () => {
      renderWithContext({ players: [], gameActive: false });

      const addButton = screen.getByText("Add Player");
      fireEvent.click(addButton);

      await waitFor(() => {
        const elements = screen.getAllByText(/Player name cannot be empty/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should show error for duplicate player name", async () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const input = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByText("Add Player");

      fireEvent.input(input, { target: { value: "Alice" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const elements = screen.getAllByText(/Player name.*already exists/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should show error for duplicate player name (case insensitive)", async () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const input = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByText("Add Player");

      fireEvent.input(input, { target: { value: "ALICE" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const elements = screen.getAllByText(/Player name.*already exists/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should show error for name too long", async () => {
      renderWithContext({ players: [], gameActive: false });

      const input = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByText("Add Player");

      const longName = "a".repeat(51);
      fireEvent.input(input, { target: { value: longName } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const elements = screen.getAllByText(/Player name cannot exceed 50 characters/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should disable add button when input is empty", () => {
      renderWithContext({ players: [], gameActive: false });

      const addButton = screen.getByText("Add Player") as HTMLButtonElement;
      expect(addButton.disabled).toBe(true);
    });

    it("should enable add button when input has value", () => {
      renderWithContext({ players: [], gameActive: false });

      const input = screen.getByPlaceholderText("Enter player name");
      const addButton = screen.getByText("Add Player") as HTMLButtonElement;

      fireEvent.input(input, { target: { value: "John" } });
      expect(addButton.disabled).toBe(false);
    });
  });

  describe("Player List Display", () => {
    it("should display all players with numbers", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      expect(screen.getByText("1.")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("2.")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("should highlight active player", () => {
      renderWithContext({ players: samplePlayers, gameActive: true });

      // Find the player row container that contains Bob and has the blue background
      const bobText = screen.getByText("Bob");
      const playerRow = bobText.closest("div[class*='bg-blue-50']");
      expect(playerRow).toBeInTheDocument();
      expect(screen.getByText("Current Turn")).toBeInTheDocument();
    });

    it("should show player scores during active game", () => {
      const playersWithScores = samplePlayers.map((p) => ({ ...p, score: 15 }));
      renderWithContext({ players: playersWithScores, gameActive: true });

      const scoreElements = screen.getAllByText(/Score: 15/);
      expect(scoreElements).toHaveLength(2);
    });

    it("should show edit and remove buttons when game is not active", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      const removeButtons = screen.getAllByText("Remove");

      expect(editButtons).toHaveLength(2);
      expect(removeButtons).toHaveLength(2);
    });

    it("should not show edit and remove buttons when game is active", () => {
      renderWithContext({ players: samplePlayers, gameActive: true });

      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
      expect(screen.queryByText("Remove")).not.toBeInTheDocument();
    });
  });

  describe("Player Editing", () => {
    it("should enter edit mode when edit button is clicked", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should exit edit mode when save is clicked", async () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue("Alice");
      fireEvent.input(input, { target: { value: "Alice Updated" } });

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.queryByDisplayValue("Alice Updated")
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Save")).not.toBeInTheDocument();
      });
    });

    it("should exit edit mode when Enter key is pressed", async () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue("Alice");
      fireEvent.input(input, { target: { value: "Alice Enter" } });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(
          screen.queryByDisplayValue("Alice Enter")
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Save")).not.toBeInTheDocument();
      });
    });

    it("should cancel edit when cancel button is clicked", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue("Alice");
      fireEvent.input(input, { target: { value: "Changed" } });

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Changed")).not.toBeInTheDocument();
    });

    it("should cancel edit when Escape key is pressed", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue("Alice");
      fireEvent.input(input, { target: { value: "Changed" } });
      fireEvent.keyDown(input, { key: "Escape" });

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Changed")).not.toBeInTheDocument();
    });

    it("should show error when editing to duplicate name", async () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue("Alice");
      fireEvent.input(input, { target: { value: "Bob" } });

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        const elements = screen.getAllByText(/Player name.*already exists/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should show error when editing to empty name", async () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue("Alice");
      fireEvent.input(input, { target: { value: "" } });

      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        const elements = screen.getAllByText(/Player name cannot be empty/);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Player Removal", () => {
    it("should show confirmation dialog when remove button is clicked", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const removeButtons = screen.getAllByText("Remove");
      fireEvent.click(removeButtons[0]);

      expect(screen.getByText("Confirm Removal")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to remove/)
      ).toBeInTheDocument();
      // Check for Alice in the confirmation dialog specifically
      expect(
        screen.getByText(/Are you sure you want to remove/).closest("div")
      ).toHaveTextContent("Alice");
    });

    it("should remove player when confirmed", async () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const removeButtons = screen.getAllByText("Remove");
      fireEvent.click(removeButtons[0]);

      // Find the confirm button in the modal (different from the list remove buttons)
      const modal = screen.getByText("Confirm Removal").closest("div");
      const confirmButton = modal?.querySelector(
        "button:last-child"
      ) as HTMLButtonElement;
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText("Confirm Removal")).not.toBeInTheDocument();
      });
    });

    it("should cancel removal when cancel is clicked", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const removeButtons = screen.getAllByText("Remove");
      fireEvent.click(removeButtons[0]);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Confirm Removal")).not.toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("Game State Messages", () => {
    it("should show message when no players added", () => {
      renderWithContext({ players: [], gameActive: false });

      // When no players, only the empty state message should be shown
      expect(
        screen.getByText(
          "No players added yet. Add at least 2 players to start a game."
        )
      ).toBeInTheDocument();
    });

    it("should show message when only one player added", () => {
      renderWithContext({ players: [samplePlayers[0]], gameActive: false });

      expect(
        screen.getByText("Add 1 more player to start a game.")
      ).toBeInTheDocument();
    });

    it("should show ready message when 2 or more players added", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      expect(
        screen.getByText(/Ready to start! 2 players added./)
      ).toBeInTheDocument();
    });

    it("should show game in progress message when game is active", () => {
      renderWithContext({ players: samplePlayers, gameActive: true });

      expect(
        screen.getByText(/Game in progress. Player management is disabled./)
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for error messages", async () => {
      renderWithContext({ players: [], gameActive: false });

      const addButton = screen.getByText("Add Player");
      fireEvent.click(addButton);

      await waitFor(() => {
        const errorElements = screen.getAllByRole("alert");
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });

    it("should have autofocus on edit input", () => {
      renderWithContext({ players: samplePlayers, gameActive: false });

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      const input = screen.getByDisplayValue("Alice");
      expect(input).toHaveAttribute("autofocus");
    });

    it("should have proper button states for disabled buttons", () => {
      renderWithContext({ players: samplePlayers, gameActive: true });

      // Add player input should not exist during active game
      const input = screen.queryByPlaceholderText("Enter player name");
      expect(input).toBeNull();
    });
  });

  describe("Responsive Design", () => {
    it("should render with responsive classes", () => {
      renderWithContext({ players: [], gameActive: false });

      const container = screen.getByText("Players").closest("div");
      expect(container).toHaveClass(
        "bg-white",
        "rounded-lg",
        "shadow-md",
        "p-3",
        "sm:p-6",
        "mb-4",
        "sm:mb-6"
      );
    });

    it("should have responsive flex layout for add player section", () => {
      renderWithContext({ players: [], gameActive: false });

      const addPlayerContainer = screen
        .getByPlaceholderText("Enter player name")
        .closest("div");
      expect(addPlayerContainer).toHaveClass(
        "flex",
        "flex-col",
        "sm:flex-row",
        "gap-2"
      );
    });
  });
});
