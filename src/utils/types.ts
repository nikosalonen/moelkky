/**
 * Type definitions for the Mölkky Score Counter application
 *
 * @format
 */

/**
 * Represents a player in the game
 */
export interface Player {
  id: string;
  name: string;
  score: number;
  penalties: number;
  isActive: boolean;
  consecutiveMisses?: number; // Number of consecutive zero-point turns
  eliminated?: boolean; // True if eliminated after three misses
}

/**
 * Represents a penalty record for tracking rule violations
 */
export interface PenaltyRecord {
  playerId: string;
  playerName: string;
  timestamp: Date;
  reason: string;
}

/**
 * Represents a complete game with all its data
 */
export interface Game {
  id: string;
  players: Player[];
  winner: Player | null;
  startTime: Date;
  endTime: Date | null;
  totalRounds: number;
  penalties: PenaltyRecord[];
}

/**
 * Possible game states
 */
export type GameState = "setup" | "playing" | "finished";

/**
 * Overall application state
 */
export interface AppState {
  gameState: GameState;
  players: Player[];
  currentPlayerIndex: number;
  gameHistory: Game[];
  currentGame: Game | null;
}

/**
 * Error types for the application
 */
export enum ErrorType {
  DUPLICATE_PLAYER = "duplicate_player",
  INVALID_SCORE = "invalid_score",
  STORAGE_ERROR = "storage_error",
  GAME_STATE_ERROR = "game_state_error",
}

/**
 * Interface for error handling
 */
export interface ErrorHandler {
  showError(type: ErrorType, message: string): void;
  clearError(): void;
}
