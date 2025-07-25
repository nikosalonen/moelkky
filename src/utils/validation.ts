/**
 * Data validation functions for the Mölkky Score Counter application
 *
 * @format
 */

import type { Player } from "./types";

/**
 * Validates a player name
 * @param name - The player name to validate
 * @param existingPlayers - Array of existing players to check for duplicates
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePlayerName(
  name: string,
  existingPlayers: Player[] = []
): {
  isValid: boolean;
  error?: string;
} {
  // Check if name is empty or only whitespace
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: "Player name cannot be empty. Please enter a valid name.",
    };
  }

  // Check if name is too short
  if (name.trim().length < 2) {
    return {
      isValid: false,
      error: "Player name must be at least 2 characters long.",
    };
  }

  // Check if name is too long
  if (name.trim().length > 50) {
    return {
      isValid: false,
      error: "Player name cannot exceed 50 characters. Please use a shorter name.",
    };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return {
      isValid: false,
      error: "Player name contains invalid characters. Please use only letters, numbers, and spaces.",
    };
  }

  // Check for duplicate names (case-insensitive)
  const trimmedName = name.trim();
  const isDuplicate = existingPlayers.some(
    (player) => player.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: `Player name "${trimmedName}" already exists. Please choose a different name.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates a score value for single pin scoring
 * @param score - The score value to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateSinglePinScore(score: number): {
  isValid: boolean;
  error?: string;
} {
  if (!Number.isInteger(score)) {
    return {
      isValid: false,
      error: "Score must be a whole number. Please enter a valid number.",
    };
  }

  if (score < 0 || score > 12) {
    return {
      isValid: false,
      error: "Single pin score must be between 0 and 12. Please enter a valid score.",
    };
  }

  return { isValid: true };
}

/**
 * Validates a score value for multiple pin scoring
 * @param score - The score value to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateMultiplePinScore(score: number): {
  isValid: boolean;
  error?: string;
} {
  if (!Number.isInteger(score)) {
    return {
      isValid: false,
      error: "Score must be a whole number. Please enter a valid number.",
    };
  }

  if (score < 2 || score > 12) {
    return {
      isValid: false,
      error: "Multiple pin score must be between 2 and 12. Please enter a valid score.",
    };
  }

  return { isValid: true };
}

/**
 * Validates if a score input is valid based on scoring type
 * @param score - The score value to validate
 * @param isSinglePin - Whether this is a single pin score
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateScore(
  score: number,
  isSinglePin: boolean
): {
  isValid: boolean;
  error?: string;
} {
  return isSinglePin
    ? validateSinglePinScore(score)
    : validateMultiplePinScore(score);
}

/**
 * Validates the minimum number of players required to start a game
 * @param players - Array of players
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateMinimumPlayers(players: Player[]): {
  isValid: boolean;
  error?: string;
} {
  if (players.length < 2) {
    return {
      isValid: false,
      error: "At least 2 players are required to start a game. Please add more players.",
    };
  }

  return { isValid: true };
}

/**
 * Validates game state transitions
 * @param currentState - Current game state
 * @param targetState - Target game state
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateGameStateTransition(
  currentState: string,
  targetState: string
): {
  isValid: boolean;
  error?: string;
} {
  const validTransitions: Record<string, string[]> = {
    setup: ["playing"],
    playing: ["finished"],
    finished: ["setup", "playing"],
  };

  const allowedStates = validTransitions[currentState] || [];
  
  if (!allowedStates.includes(targetState)) {
    return {
      isValid: false,
      error: `Cannot transition from "${currentState}" to "${targetState}". Invalid game state transition.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates storage operations
 * @param key - Storage key
 * @param value - Value to store
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateStorageData(key: string, value: any): {
  isValid: boolean;
  error?: string;
} {
  if (!key || typeof key !== "string") {
    return {
      isValid: false,
      error: "Storage key must be a valid string.",
    };
  }

  if (value === undefined || value === null) {
    return {
      isValid: false,
      error: "Cannot store undefined or null values.",
    };
  }

  try {
    JSON.stringify(value);
  } catch (error) {
    return {
      isValid: false,
      error: "Data cannot be serialized to JSON. Please check the data structure.",
    };
  }

  return { isValid: true };
}
