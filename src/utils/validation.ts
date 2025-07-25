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
      error: "Player name cannot be empty",
    };
  }

  // Check if name is too long
  if (name.trim().length > 50) {
    return {
      isValid: false,
      error: "Player name cannot exceed 50 characters",
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
      error: "Player name already exists",
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
      error: "Score must be a whole number",
    };
  }

  if (score < 1 || score > 12) {
    return {
      isValid: false,
      error: "Single pin score must be between 1 and 12",
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
      error: "Score must be a whole number",
    };
  }

  if (score < 2 || score > 12) {
    return {
      isValid: false,
      error: "Multiple pin score must be between 2 and 12",
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
      error: "At least 2 players are required to start a game",
    };
  }

  return { isValid: true };
}
