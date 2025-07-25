/**
 * Tests for enhanced validation utilities
 *
 * @format
 */

import { describe, it, expect } from "vitest";
import {
  validatePlayerName,
  validateSinglePinScore,
  validateMultiplePinScore,
  validateScore,
  validateMinimumPlayers,
  validateGameStateTransition,
  validateStorageData,
} from "../../src/utils/validation";
import type { Player } from "../../src/utils/types";

describe("Validation Utilities", () => {
  describe("validatePlayerName", () => {
    const existingPlayers: Player[] = [
      { id: "1", name: "Alice", score: 0, penalties: 0, isActive: false },
      { id: "2", name: "Bob", score: 0, penalties: 0, isActive: false },
    ];

    it("should validate a valid player name", () => {
      const result = validatePlayerName("Charlie", existingPlayers);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty player names", () => {
      const result = validatePlayerName("", existingPlayers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Player name cannot be empty. Please enter a valid name.");
    });

    it("should reject whitespace-only names", () => {
      const result = validatePlayerName("   ", existingPlayers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Player name cannot be empty. Please enter a valid name.");
    });

    it("should reject names that are too short", () => {
      const result = validatePlayerName("A", existingPlayers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Player name must be at least 2 characters long.");
    });

    it("should reject names that are too long", () => {
      const longName = "A".repeat(51);
      const result = validatePlayerName(longName, existingPlayers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Player name cannot exceed 50 characters. Please use a shorter name.");
    });

    it("should reject names with invalid characters", () => {
      const invalidNames = ["Player<", "Player>", "Player:", "Player\"", "Player/", "Player\\", "Player|", "Player?", "Player*"];
      
      invalidNames.forEach(name => {
        const result = validatePlayerName(name, existingPlayers);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Player name contains invalid characters. Please use only letters, numbers, and spaces.");
      });
    });

    it("should reject duplicate names (case-insensitive)", () => {
      const result = validatePlayerName("alice", existingPlayers);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Player name "alice" already exists. Please choose a different name.');
    });

    it("should accept names with spaces and numbers", () => {
      const validNames = ["Player 1", "Test User", "John123", "Mary Jane"];
      
      validNames.forEach(name => {
        const result = validatePlayerName(name, existingPlayers);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe("validateSinglePinScore", () => {
    it("should validate valid single pin scores", () => {
      const validScores = [0, 1, 6, 12];
      
      validScores.forEach(score => {
        const result = validateSinglePinScore(score);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject non-integer scores", () => {
      const result = validateSinglePinScore(5.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Score must be a whole number. Please enter a valid number.");
    });

    it("should reject scores below 0", () => {
      const result = validateSinglePinScore(-1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Single pin score must be between 0 and 12. Please enter a valid score.");
    });

    it("should reject scores above 12", () => {
      const result = validateSinglePinScore(13);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Single pin score must be between 0 and 12. Please enter a valid score.");
    });
  });

  describe("validateMultiplePinScore", () => {
    it("should validate valid multiple pin scores", () => {
      const validScores = [2, 6, 12];
      
      validScores.forEach(score => {
        const result = validateMultiplePinScore(score);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject non-integer scores", () => {
      const result = validateMultiplePinScore(5.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Score must be a whole number. Please enter a valid number.");
    });

    it("should reject scores below 2", () => {
      const result = validateMultiplePinScore(1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Multiple pin score must be between 2 and 12. Please enter a valid score.");
    });

    it("should reject scores above 12", () => {
      const result = validateMultiplePinScore(13);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Multiple pin score must be between 2 and 12. Please enter a valid score.");
    });
  });

  describe("validateScore", () => {
    it("should validate single pin scores correctly", () => {
      const result = validateScore(5, true);
      expect(result.isValid).toBe(true);
    });

    it("should validate multiple pin scores correctly", () => {
      const result = validateScore(5, false);
      expect(result.isValid).toBe(true);
    });

    it("should reject invalid single pin scores", () => {
      const result = validateScore(13, true);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Single pin score must be between 0 and 12. Please enter a valid score.");
    });

    it("should reject invalid multiple pin scores", () => {
      const result = validateScore(1, false);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Multiple pin score must be between 2 and 12. Please enter a valid score.");
    });
  });

  describe("validateMinimumPlayers", () => {
    it("should validate when there are enough players", () => {
      const players: Player[] = [
        { id: "1", name: "Alice", score: 0, penalties: 0, isActive: false },
        { id: "2", name: "Bob", score: 0, penalties: 0, isActive: false },
      ];
      
      const result = validateMinimumPlayers(players);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject when there are not enough players", () => {
      const players: Player[] = [
        { id: "1", name: "Alice", score: 0, penalties: 0, isActive: false },
      ];
      
      const result = validateMinimumPlayers(players);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("At least 2 players are required to start a game. Please add more players.");
    });

    it("should reject when there are no players", () => {
      const result = validateMinimumPlayers([]);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("At least 2 players are required to start a game. Please add more players.");
    });
  });

  describe("validateGameStateTransition", () => {
    it("should validate valid state transitions", () => {
      const validTransitions = [
        { from: "setup", to: "playing" },
        { from: "playing", to: "finished" },
        { from: "finished", to: "setup" },
        { from: "finished", to: "playing" },
      ];
      
      validTransitions.forEach(({ from, to }) => {
        const result = validateGameStateTransition(from, to);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject invalid state transitions", () => {
      const invalidTransitions = [
        { from: "setup", to: "finished" },
        { from: "playing", to: "setup" },
        { from: "setup", to: "invalid" },
      ];
      
      invalidTransitions.forEach(({ from, to }) => {
        const result = validateGameStateTransition(from, to);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("Cannot transition from");
        expect(result.error).toContain("Invalid game state transition");
      });
    });
  });

  describe("validateStorageData", () => {
    it("should validate valid storage data", () => {
      const validData = [
        { key: "test", value: "string" },
        { key: "test", value: 123 },
        { key: "test", value: { obj: "test" } },
        { key: "test", value: [1, 2, 3] },
      ];
      
      validData.forEach(({ key, value }) => {
        const result = validateStorageData(key, value);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject invalid keys", () => {
      const invalidKeys = ["", null, undefined, 123];
      
      invalidKeys.forEach(key => {
        const result = validateStorageData(key as any, "test");
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Storage key must be a valid string.");
      });
    });

    it("should reject null and undefined values", () => {
      const invalidValues = [null, undefined];
      
      invalidValues.forEach(value => {
        const result = validateStorageData("test", value);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Cannot store undefined or null values.");
      });
    });

    it("should reject non-serializable values", () => {
      const circularObj: any = {};
      circularObj.self = circularObj;
      
      const result = validateStorageData("test", circularObj);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Data cannot be serialized to JSON. Please check the data structure.");
    });
  });
});
