/**
 * Tests for usePlayerManagement hook
 *
 * @format
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import type { ComponentChildren } from "preact";
import { GameProvider } from "../../src/context/GameContext";
import { usePlayerManagement } from "../../src/hooks/usePlayerManagement";
import { createPlayer } from "../../src/utils/gameStateUtils";

// Mock session storage
vi.mock("../../src/utils/storage/sessionStorage", () => ({
  sessionStorageUtil: {
    loadAppState: vi.fn(() => null),
    saveAppState: vi.fn(),
    saveCurrentGame: vi.fn(),
    saveGameHistory: vi.fn(),
  },
}));

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: ComponentChildren }) => (
  <GameProvider>{children}</GameProvider>
);

describe("usePlayerManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial empty players array", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    expect(result.current.players).toEqual([]);
    expect(result.current.canModifyPlayers).toBe(true);
  });

  it("should add a player successfully", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      const response = result.current.addPlayer("John Doe");
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.players).toHaveLength(1);
    expect(result.current.players[0].name).toBe("John Doe");
  });

  it("should prevent adding duplicate player names", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      result.current.addPlayer("John Doe");
    });

    act(() => {
      const response = result.current.addPlayer("John Doe");
      expect(response.success).toBe(false);
      expect(response.error).toContain("already exists");
    });

    expect(result.current.players).toHaveLength(1);
  });

  it("should prevent adding empty player names", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      const response = result.current.addPlayer("");
      expect(response.success).toBe(false);
      expect(response.error).toContain("cannot be empty");
    });

    expect(result.current.players).toHaveLength(0);
  });

  it("should prevent adding whitespace-only player names", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      const response = result.current.addPlayer("   ");
      expect(response.success).toBe(false);
      expect(response.error).toContain("cannot be empty");
    });

    expect(result.current.players).toHaveLength(0);
  });

  it("should update a player successfully", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      result.current.addPlayer("John Doe");
    });

    const playerId = result.current.players[0].id;

    act(() => {
      const response = result.current.updatePlayer(playerId, {
        name: "Jane Doe",
      });
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.players[0].name).toBe("Jane Doe");
  });

  it("should prevent updating to duplicate player name", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      result.current.addPlayer("John Doe");
      result.current.addPlayer("Jane Doe");
    });

    const playerId = result.current.players[1].id;

    act(() => {
      const response = result.current.updatePlayer(playerId, {
        name: "John Doe",
      });
      expect(response.success).toBe(false);
      expect(response.error).toContain("already exists");
    });

    expect(result.current.players[1].name).toBe("Jane Doe");
  });

  it("should fail to update non-existent player", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      const response = result.current.updatePlayer("non-existent-id", {
        name: "Test",
      });
      expect(response.success).toBe(false);
      expect(response.error).toBe("Player not found");
    });
  });

  it("should remove a player successfully", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      result.current.addPlayer("John Doe");
    });

    const playerId = result.current.players[0].id;

    act(() => {
      const response = result.current.removePlayer(playerId);
      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    expect(result.current.players).toHaveLength(0);
  });

  it("should fail to remove non-existent player", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      const response = result.current.removePlayer("non-existent-id");
      expect(response.success).toBe(false);
      expect(response.error).toBe("Player not found");
    });
  });

  it("should find player by ID", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      result.current.addPlayer("John Doe");
    });

    const playerId = result.current.players[0].id;

    const foundPlayer = result.current.getPlayerById(playerId);
    expect(foundPlayer).toBeDefined();
    expect(foundPlayer?.name).toBe("John Doe");

    const notFoundPlayer = result.current.getPlayerById("non-existent-id");
    expect(notFoundPlayer).toBeUndefined();
  });

  it("should find player by name", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    act(() => {
      result.current.addPlayer("John Doe");
    });

    const foundPlayer = result.current.getPlayerByName("John Doe");
    expect(foundPlayer).toBeDefined();
    expect(foundPlayer?.name).toBe("John Doe");

    const notFoundPlayer = result.current.getPlayerByName("Jane Doe");
    expect(notFoundPlayer).toBeUndefined();
  });

  it("should indicate when players can be modified", () => {
    const { result } = renderHook(() => usePlayerManagement(), { wrapper });

    // In setup state, players can be modified
    expect(result.current.canModifyPlayers).toBe(true);
  });
});
