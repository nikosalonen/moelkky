/**
 * Utility functions for game state management
 *
 * @format
 */

import type { Player, Game, GameState, PenaltyRecord } from "./types";

/**
 * Creates a new player with default values
 * @param name - The player's name
 * @returns A new Player object
 */
export function createPlayer(name: string): Player {
  return {
    id: generateId(),
    name: name.trim(),
    score: 0,
    penalties: 0,
    isActive: false,
  };
}

/**
 * Creates a new game with the given players
 * @param players - Array of players for the game
 * @returns A new Game object
 */
export function createGame(players: Player[]): Game {
  return {
    id: generateId(),
    players: players.map((player) => ({ ...player, score: 0, penalties: 0 })),
    winner: null,
    startTime: new Date(),
    endTime: null,
    totalRounds: 0,
    penalties: [],
  };
}

/**
 * Creates a penalty record
 * @param playerId - The ID of the player receiving the penalty
 * @param playerName - The name of the player receiving the penalty
 * @param reason - The reason for the penalty
 * @returns A new PenaltyRecord object
 */
export function createPenaltyRecord(
  playerId: string,
  playerName: string,
  reason: string = "Rule violation"
): PenaltyRecord {
  return {
    playerId,
    playerName,
    timestamp: new Date(),
    reason,
  };
}

/**
 * Applies a score to a player, handling Mölkky scoring rules
 * @param player - The player to update
 * @param score - The score to add
 * @returns Updated player with new score
 */
export function applyScore(player: Player, score: number): Player {
  const newScore = player.score + score;

  // If score exceeds 50, reset to 25 (Mölkky rule)
  if (newScore > 50) {
    return {
      ...player,
      score: 25,
    };
  }

  return {
    ...player,
    score: newScore,
  };
}

/**
 * Applies a penalty to a player (resets score to 25)
 * @param player - The player to penalize
 * @returns Updated player with penalty applied
 */
export function applyPenalty(player: Player): Player {
  return {
    ...player,
    score: 25,
    penalties: player.penalties + 1,
  };
}

/**
 * Checks if a player has won the game (score exactly 50)
 * @param player - The player to check
 * @returns True if the player has won
 */
export function hasPlayerWon(player: Player): boolean {
  return player.score === 50;
}

/**
 * Gets the next player index in turn rotation
 * @param currentIndex - Current player index
 * @param totalPlayers - Total number of players
 * @returns Next player index
 */
export function getNextPlayerIndex(
  currentIndex: number,
  totalPlayers: number
): number {
  return (currentIndex + 1) % totalPlayers;
}

/**
 * Calculates points needed for a player to reach 50
 * @param player - The player to calculate for
 * @returns Number of points needed to reach 50
 */
export function getPointsNeeded(player: Player): number {
  return Math.max(0, 50 - player.score);
}

/**
 * Resets all players' scores to 0 for a new game
 * @param players - Array of players to reset
 * @returns Array of players with reset scores
 */
export function resetPlayersForNewGame(players: Player[]): Player[] {
  return players.map((player) => ({
    ...player,
    score: 0,
    penalties: 0,
    isActive: false,
  }));
}

/**
 * Finds the winner in a game (player with score exactly 50)
 * @param players - Array of players to check
 * @returns The winning player or null if no winner
 */
export function findWinner(players: Player[]): Player | null {
  return players.find((player) => player.score === 50) || null;
}

/**
 * Generates a unique ID for players and games
 * @returns A unique string ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validates if a game state transition is valid
 * @param currentState - Current game state
 * @param newState - Desired new state
 * @returns True if transition is valid
 */
export function isValidStateTransition(
  currentState: GameState,
  newState: GameState
): boolean {
  const validTransitions: Record<GameState, GameState[]> = {
    setup: ["playing"],
    playing: ["finished"],
    finished: ["setup"],
  };

  return validTransitions[currentState].includes(newState);
}

/**
 * Completes a game by setting the end time and winner
 * @param game - The game to complete
 * @param winner - The winning player
 * @returns Updated game object
 */
export function completeGame(game: Game, winner: Player): Game {
  return {
    ...game,
    winner,
    endTime: new Date(),
  };
}
