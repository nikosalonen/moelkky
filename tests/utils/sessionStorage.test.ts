/**
 * Unit tests for session storage utilities
 *
 * @format
 */

import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import {
  SessionStorageUtil,
  StorageError,
  StorageService,
  STORAGE_KEYS,
  sessionStorageUtil,
} from "../../src/utils/storage";
import {
  AppState,
  Game,
  Player,
  GameState,
  ErrorType,
} from "../../src/utils/types";

// Mock storage service for testing
class MockStorageService implements StorageService {
  private storage = new Map<string, string>();
  private shouldThrow = false;

  getItem(key: string): string | null {
    if (this.shouldThrow) throw new Error("Storage error");
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrow) throw new Error("Storage error");
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    if (this.shouldThrow) throw new Error("Storage error");
    this.storage.delete(key);
  }

  clear(): void {
    if (this.shouldThrow) throw new Error("Storage error");
    this.storage.clear();
  }

  // Test utilities
  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }

  getStorageSize(): number {
    return this.storage.size;
  }

  hasKey(key: string): boolean {
    return this.storage.has(key);
  }
}

describe("SessionStorageUtil", () => {
  let mockStorage: MockStorageService;
  let storageUtil: SessionStorageUtil;

  // Test data
  const mockPlayer: Player = {
    id: "player1",
    name: "Test Player",
    score: 25,
    penalties: 1,
    isActive: true,
  };

  const mockGame: Game = {
    id: "game1",
    players: [mockPlayer],
    winner: null,
    startTime: new Date("2023-01-01T10:00:00Z"),
    endTime: null,
    totalRounds: 5,
    penalties: [],
  };

  const mockAppState: AppState = {
    gameState: "playing" as GameState,
    players: [mockPlayer],
    currentPlayerIndex: 0,
    gameHistory: [],
    currentGame: mockGame,
  };

  beforeEach(() => {
    mockStorage = new MockStorageService();
    storageUtil = new SessionStorageUtil(mockStorage);
  });

  describe("Storage Keys", () => {
    it("should have correct storage keys", () => {
      expect(STORAGE_KEYS.CURRENT_GAME).toBe("molkky_current_game");
      expect(STORAGE_KEYS.GAME_HISTORY).toBe("molkky_game_history");
      expect(STORAGE_KEYS.APP_STATE).toBe("molkky_app_state");
    });
  });

  describe("App State Management", () => {
    it("should save and load app state correctly", () => {
      storageUtil.saveAppState(mockAppState);
      const loaded = storageUtil.loadAppState();

      expect(loaded).toEqual(mockAppState);
      expect(loaded?.gameState).toBe("playing");
      expect(loaded?.players).toHaveLength(1);
      expect(loaded?.currentGame?.id).toBe("game1");
    });

    it("should return null when no app state is stored", () => {
      const loaded = storageUtil.loadAppState();
      expect(loaded).toBeNull();
    });

    it("should handle corrupted app state data gracefully", () => {
      mockStorage.setItem(STORAGE_KEYS.APP_STATE, "invalid json");
      const loaded = storageUtil.loadAppState();
      expect(loaded).toBeNull();
    });
  });

  describe("Current Game Management", () => {
    it("should save and load current game correctly", () => {
      storageUtil.saveCurrentGame(mockGame);
      const loaded = storageUtil.loadCurrentGame();

      expect(loaded).toEqual(mockGame);
      expect(loaded?.id).toBe("game1");
      expect(loaded?.players).toHaveLength(1);
    });

    it("should return null when no current game is stored", () => {
      const loaded = storageUtil.loadCurrentGame();
      expect(loaded).toBeNull();
    });

    it("should restore Date objects correctly", () => {
      storageUtil.saveCurrentGame(mockGame);
      const loaded = storageUtil.loadCurrentGame();

      expect(loaded?.startTime).toBeInstanceOf(Date);
      expect(loaded?.startTime.toISOString()).toBe("2023-01-01T10:00:00.000Z");
    });
  });

  describe("Game History Management", () => {
    it("should save and load game history correctly", () => {
      const history = [mockGame];
      storageUtil.saveGameHistory(history);
      const loaded = storageUtil.loadGameHistory();

      expect(loaded).toEqual(history);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe("game1");
    });

    it("should return empty array when no history is stored", () => {
      const loaded = storageUtil.loadGameHistory();
      expect(loaded).toEqual([]);
    });

    it("should add game to history correctly", () => {
      const existingHistory = [mockGame];
      storageUtil.saveGameHistory(existingHistory);

      const newGame: Game = {
        ...mockGame,
        id: "game2",
        winner: mockPlayer,
        endTime: new Date("2023-01-01T11:00:00Z"),
      };

      storageUtil.addGameToHistory(newGame);
      const loaded = storageUtil.loadGameHistory();

      expect(loaded).toHaveLength(2);
      expect(loaded[0].id).toBe("game1");
      expect(loaded[1].id).toBe("game2");
      expect(loaded[1].winner).toEqual(mockPlayer);
    });
  });

  describe("Error Handling", () => {
    it("should throw StorageError when save fails", () => {
      mockStorage.setShouldThrow(true);

      expect(() => {
        storageUtil.saveAppState(mockAppState);
      }).toThrow(StorageError);
    });

    it("should use fallback storage when sessionStorage fails", () => {
      mockStorage.setShouldThrow(true);

      // Should throw but still store in fallback
      expect(() => {
        storageUtil.saveAppState(mockAppState);
      }).toThrow(StorageError);

      // Should be able to load from fallback
      mockStorage.setShouldThrow(false);
      const loaded = storageUtil.loadAppState();
      expect(loaded).toEqual(mockAppState);
    });

    it("should handle JSON parse errors gracefully", () => {
      mockStorage.setItem(STORAGE_KEYS.CURRENT_GAME, "invalid json");
      const loaded = storageUtil.loadCurrentGame();
      expect(loaded).toBeNull();
    });

    it("should handle JSON stringify errors", () => {
      const circularRef: any = {};
      circularRef.self = circularRef;

      expect(() => {
        storageUtil.saveAppState(circularRef);
      }).toThrow(StorageError);
    });
  });

  describe("Storage Availability", () => {
    it("should detect when storage is available", () => {
      expect(storageUtil.isStorageAvailable()).toBe(true);
    });

    it("should detect when storage is not available", () => {
      mockStorage.setShouldThrow(true);
      expect(storageUtil.isStorageAvailable()).toBe(false);
    });

    it("should provide storage info", () => {
      const info = storageUtil.getStorageInfo();
      expect(info.isAvailable).toBe(true);
      expect(info.hasFallbackData).toBe(false);
      expect(info.fallbackKeys).toEqual([]);
    });

    it("should show fallback data in storage info", () => {
      mockStorage.setShouldThrow(true);

      try {
        storageUtil.saveAppState(mockAppState);
      } catch {
        // Expected to throw
      }

      const info = storageUtil.getStorageInfo();
      expect(info.hasFallbackData).toBe(true);
      expect(info.fallbackKeys).toContain(STORAGE_KEYS.APP_STATE);
    });
  });

  describe("Clear Operations", () => {
    it("should clear all stored data", () => {
      storageUtil.saveAppState(mockAppState);
      storageUtil.saveCurrentGame(mockGame);
      storageUtil.saveGameHistory([mockGame]);

      expect(mockStorage.getStorageSize()).toBe(3);

      storageUtil.clearAll();

      expect(mockStorage.getStorageSize()).toBe(0);
      expect(storageUtil.loadAppState()).toBeNull();
      expect(storageUtil.loadCurrentGame()).toBeNull();
      expect(storageUtil.loadGameHistory()).toEqual([]);
    });

    it("should throw StorageError when clear fails", () => {
      mockStorage.setShouldThrow(true);

      expect(() => {
        storageUtil.clearAll();
      }).toThrow(StorageError);
    });
  });

  describe("Date Restoration", () => {
    it("should restore Date objects from ISO strings", () => {
      const gameWithDates: Game = {
        ...mockGame,
        startTime: new Date("2023-01-01T10:00:00.000Z"),
        endTime: new Date("2023-01-01T11:30:00.000Z"),
        penalties: [
          {
            playerId: "player1",
            playerName: "Test Player",
            timestamp: new Date("2023-01-01T10:15:00.000Z"),
            reason: "Test penalty",
          },
        ],
      };

      storageUtil.saveCurrentGame(gameWithDates);
      const loaded = storageUtil.loadCurrentGame();

      expect(loaded?.startTime).toBeInstanceOf(Date);
      expect(loaded?.endTime).toBeInstanceOf(Date);
      expect(loaded?.penalties[0].timestamp).toBeInstanceOf(Date);
      expect(loaded?.startTime.toISOString()).toBe("2023-01-01T10:00:00.000Z");
      expect(loaded?.endTime?.toISOString()).toBe("2023-01-01T11:30:00.000Z");
      expect(loaded?.penalties[0].timestamp.toISOString()).toBe(
        "2023-01-01T10:15:00.000Z"
      );
    });

    it("should handle arrays with Date objects", () => {
      const history = [
        {
          ...mockGame,
          startTime: new Date("2023-01-01T10:00:00.000Z"),
          endTime: new Date("2023-01-01T11:00:00.000Z"),
        },
        {
          ...mockGame,
          id: "game2",
          startTime: new Date("2023-01-01T12:00:00.000Z"),
          endTime: new Date("2023-01-01T13:00:00.000Z"),
        },
      ];

      storageUtil.saveGameHistory(history);
      const loaded = storageUtil.loadGameHistory();

      expect(loaded[0].startTime).toBeInstanceOf(Date);
      expect(loaded[0].endTime).toBeInstanceOf(Date);
      expect(loaded[1].startTime).toBeInstanceOf(Date);
      expect(loaded[1].endTime).toBeInstanceOf(Date);
    });
  });

  describe("StorageError", () => {
    it("should create StorageError with correct properties", () => {
      const originalError = new Error("Original error");
      const storageError = new StorageError(
        "Test message",
        ErrorType.STORAGE_ERROR,
        originalError
      );

      expect(storageError.message).toBe("Test message");
      expect(storageError.type).toBe(ErrorType.STORAGE_ERROR);
      expect(storageError.originalError).toBe(originalError);
      expect(storageError.name).toBe("StorageError");
    });

    it("should create StorageError with default type", () => {
      const storageError = new StorageError("Test message");

      expect(storageError.type).toBe(ErrorType.STORAGE_ERROR);
      expect(storageError.originalError).toBeUndefined();
    });
  });

  describe("Default Instance", () => {
    it("should export a default sessionStorageUtil instance", () => {
      expect(sessionStorageUtil).toBeInstanceOf(SessionStorageUtil);
    });
  });
});
