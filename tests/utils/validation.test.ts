/**
 * Unit tests for validation functions
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
} from "../../src/utils/validation";
import type { Player } from "../../src/utils/types";

describe("validatePlayerName", () => {
  const existingPlayers: Player[] = [
    {
      id: "1",
      name: "John",
      score: 0,
      penalties: 0,
      isActive: false,
    },
    {
      id: "2",
      name: "Jane",
      score: 0,
      penalties: 0,
      isActive: false,
    },
  ];

  it("should validate a valid player name", () => {
    const result = validatePlayerName("Alice", existingPlayers);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject empty player name", () => {
    const result = validatePlayerName("", existingPlayers);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Player name cannot be empty");
  });

  it("should reject whitespace-only player name", () => {
    const result = validatePlayerName("   ", existingPlayers);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Player name cannot be empty");
  });

  it("should reject player name that is too long", () => {
    const longName = "a".repeat(51);
    const result = validatePlayerName(longName, existingPlayers);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Player name cannot exceed 50 characters");
  });

  it("should reject duplicate player name (case-insensitive)", () => {
    const result = validatePlayerName("john", existingPlayers);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Player name already exists");
  });

  it("should reject exact duplicate player name", () => {
    const result = validatePlayerName("John", existingPlayers);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Player name already exists");
  });

  it("should validate when no existing players provided", () => {
    const result = validatePlayerName("Alice");
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should trim whitespace from player name during validation", () => {
    const result = validatePlayerName("  Alice  ", existingPlayers);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe("validateSinglePinScore", () => {
  it("should validate valid single pin scores", () => {
    for (let score = 1; score <= 12; score++) {
      const result = validateSinglePinScore(score);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it("should accept score of 0", () => {
    const result = validateSinglePinScore(0);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject score above 12", () => {
    const result = validateSinglePinScore(13);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Single pin score must be between 0 and 12");
  });

  it("should reject non-integer scores", () => {
    const result = validateSinglePinScore(5.5);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Score must be a whole number");
  });

  it("should reject negative scores", () => {
    const result = validateSinglePinScore(-1);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Single pin score must be between 0 and 12");
  });
});

describe("validateMultiplePinScore", () => {
  it("should validate valid multiple pin scores", () => {
    for (let score = 2; score <= 12; score++) {
      const result = validateMultiplePinScore(score);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it("should reject score below 2", () => {
    const result = validateMultiplePinScore(1);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Multiple pin score must be between 2 and 12");
  });

  it("should reject score above 12", () => {
    const result = validateMultiplePinScore(13);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Multiple pin score must be between 2 and 12");
  });

  it("should reject non-integer scores", () => {
    const result = validateMultiplePinScore(3.7);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Score must be a whole number");
  });

  it("should reject zero score", () => {
    const result = validateMultiplePinScore(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Multiple pin score must be between 2 and 12");
  });
});

describe("validateScore", () => {
  it("should validate single pin scores correctly", () => {
    const result = validateScore(5, true);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should validate multiple pin scores correctly", () => {
    const result = validateScore(3, false);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should accept valid single pin score including 0", () => {
    const result = validateScore(0, true);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject invalid multiple pin score", () => {
    const result = validateScore(1, false);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Multiple pin score must be between 2 and 12");
  });
});

describe("validateMinimumPlayers", () => {
  it("should validate when there are enough players", () => {
    const players: Player[] = [
      { id: "1", name: "John", score: 0, penalties: 0, isActive: false },
      { id: "2", name: "Jane", score: 0, penalties: 0, isActive: false },
    ];
    const result = validateMinimumPlayers(players);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject when there is only one player", () => {
    const players: Player[] = [
      { id: "1", name: "John", score: 0, penalties: 0, isActive: false },
    ];
    const result = validateMinimumPlayers(players);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      "At least 2 players are required to start a game"
    );
  });

  it("should reject when there are no players", () => {
    const players: Player[] = [];
    const result = validateMinimumPlayers(players);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      "At least 2 players are required to start a game"
    );
  });

  it("should validate with more than 2 players", () => {
    const players: Player[] = [
      { id: "1", name: "John", score: 0, penalties: 0, isActive: false },
      { id: "2", name: "Jane", score: 0, penalties: 0, isActive: false },
      { id: "3", name: "Bob", score: 0, penalties: 0, isActive: false },
    ];
    const result = validateMinimumPlayers(players);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
