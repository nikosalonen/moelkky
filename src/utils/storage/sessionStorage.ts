/**
 * Session storage utilities for persisting game state and history
 * Provides functions for saving and loading game data with error handling
 *
 * @format
 */

import { AppState, Game, ErrorType } from "../types";

// Storage keys as defined in the design document
export const STORAGE_KEYS = {
  CURRENT_GAME: "molkky_current_game",
  GAME_HISTORY: "molkky_game_history",
  APP_STATE: "molkky_app_state",
} as const;

/**
 * Storage service interface for dependency injection and testing
 */
export interface StorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Default session storage implementation
 */
export const defaultStorageService: StorageService = {
  getItem: (key: string) => sessionStorage.getItem(key),
  setItem: (key: string, value: string) => sessionStorage.setItem(key, value),
  removeItem: (key: string) => sessionStorage.removeItem(key),
  clear: () => sessionStorage.clear(),
};

/**
 * Storage error class for handling storage-related errors
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType = ErrorType.STORAGE_ERROR,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Storage utility class with error handling and graceful fallbacks
 */
export class SessionStorageUtil {
  private storage: StorageService;
  private fallbackData: Map<string, any> = new Map();

  constructor(storage: StorageService = defaultStorageService) {
    this.storage = storage;
  }

  /**
   * Safely parse JSON data with error handling
   */
  private safeJsonParse<T>(data: string | null, fallback: T): T {
    if (!data) return fallback;

    try {
      const parsed = JSON.parse(data);
      // Restore Date objects from ISO strings
      return this.restoreDates(parsed);
    } catch (error) {
      console.warn("Failed to parse JSON from storage:", error);
      return fallback;
    }
  }

  /**
   * Safely stringify JSON data with error handling
   */
  private safeJsonStringify(data: any): string | null {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error("Failed to stringify data for storage:", error);
      throw new StorageError(
        "Failed to serialize data for storage",
        ErrorType.STORAGE_ERROR,
        error as Error
      );
    }
  }

  /**
   * Restore Date objects from ISO strings in parsed JSON
   */
  private restoreDates(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.restoreDates(item));
    }

    const restored: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && this.isISODateString(value)) {
        restored[key] = new Date(value);
      } else if (typeof value === "object" && value !== null) {
        restored[key] = this.restoreDates(value);
      } else {
        restored[key] = value;
      }
    }

    return restored;
  }

  /**
   * Check if a string is an ISO date string
   */
  private isISODateString(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(str);
  }

  /**
   * Save data to storage with error handling and fallback
   */
  private saveToStorage<T>(key: string, data: T): void {
    try {
      const serialized = this.safeJsonStringify(data);
      if (serialized) {
        this.storage.setItem(key, serialized);
        // Clear fallback data on successful save
        this.fallbackData.delete(key);
      }
    } catch (error) {
      console.warn(
        `Failed to save to sessionStorage, using fallback for key: ${key}`,
        error
      );
      // Store in fallback memory storage
      this.fallbackData.set(key, data);
      throw new StorageError(
        `Failed to save data to storage for key: ${key}`,
        ErrorType.STORAGE_ERROR,
        error as Error
      );
    }
  }

  /**
   * Load data from storage with error handling and fallback
   */
  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = this.storage.getItem(key);
      if (data) {
        return this.safeJsonParse(data, fallback);
      }
    } catch (error) {
      console.warn(`Failed to load from sessionStorage for key: ${key}`, error);
    }

    // Check fallback data
    if (this.fallbackData.has(key)) {
      return this.fallbackData.get(key);
    }

    return fallback;
  }

  /**
   * Save complete application state
   */
  saveAppState(appState: AppState): void {
    this.saveToStorage(STORAGE_KEYS.APP_STATE, appState);
  }

  /**
   * Load complete application state
   */
  loadAppState(): AppState | null {
    const defaultState: AppState = {
      gameState: "setup",
      players: [],
      currentPlayerIndex: 0,
      gameHistory: [],
      currentGame: null,
    };

    const loaded = this.loadFromStorage(STORAGE_KEYS.APP_STATE, null);
    return loaded || null;
  }

  /**
   * Save current game state
   */
  saveCurrentGame(game: Game): void {
    this.saveToStorage(STORAGE_KEYS.CURRENT_GAME, game);
  }

  /**
   * Load current game state
   */
  loadCurrentGame(): Game | null {
    return this.loadFromStorage(STORAGE_KEYS.CURRENT_GAME, null);
  }

  /**
   * Save game history
   */
  saveGameHistory(history: Game[]): void {
    this.saveToStorage(STORAGE_KEYS.GAME_HISTORY, history);
  }

  /**
   * Load game history
   */
  loadGameHistory(): Game[] {
    return this.loadFromStorage(STORAGE_KEYS.GAME_HISTORY, []);
  }

  /**
   * Add a completed game to history
   */
  addGameToHistory(game: Game): void {
    const currentHistory = this.loadGameHistory();
    const updatedHistory = [...currentHistory, game];
    this.saveGameHistory(updatedHistory);
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    try {
      this.storage.removeItem(STORAGE_KEYS.APP_STATE);
      this.storage.removeItem(STORAGE_KEYS.CURRENT_GAME);
      this.storage.removeItem(STORAGE_KEYS.GAME_HISTORY);
      this.fallbackData.clear();
    } catch (error) {
      console.warn("Failed to clear storage:", error);
      throw new StorageError(
        "Failed to clear storage",
        ErrorType.STORAGE_ERROR,
        error as Error
      );
    }
  }

  /**
   * Check if storage is available and working
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = "__molkky_storage_test__";
      const testValue = "test";
      this.storage.setItem(testKey, testValue);
      const retrieved = this.storage.getItem(testKey);
      this.storage.removeItem(testKey);
      return retrieved === testValue;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    isAvailable: boolean;
    hasFallbackData: boolean;
    fallbackKeys: string[];
  } {
    return {
      isAvailable: this.isStorageAvailable(),
      hasFallbackData: this.fallbackData.size > 0,
      fallbackKeys: Array.from(this.fallbackData.keys()),
    };
  }
}

// Export a default instance for convenience
export const sessionStorageUtil = new SessionStorageUtil();
