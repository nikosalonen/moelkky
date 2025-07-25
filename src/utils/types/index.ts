/**
 * Core data models and types for the Mölkky Score Counter application
 *
 * @format
 */

export interface Player {
  id: string;
  name: string;
  score: number;
  penalties: number;
  isActive: boolean;
}

export interface PenaltyRecord {
  playerId: string;
  playerName: string;
  timestamp: Date;
  reason: string;
}

export interface Game {
  id: string;
  players: Player[];
  winner: Player | null;
  startTime: Date;
  endTime: Date | null;
  totalRounds: number;
  penalties: PenaltyRecord[];
}

export type GameState = "setup" | "playing" | "finished";

export interface AppState {
  gameState: GameState;
  players: Player[];
  currentPlayerIndex: number;
  gameHistory: Game[];
  currentGame: Game | null;
}

export enum ErrorType {
  DUPLICATE_PLAYER = "duplicate_player",
  INVALID_SCORE = "invalid_score",
  STORAGE_ERROR = "storage_error",
  GAME_STATE_ERROR = "game_state_error",
}

export interface ErrorHandler {
  showError(type: ErrorType, message: string): void;
  clearError(): void;
}
