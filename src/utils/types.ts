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
  teamId?: string; // Optional team ID for team-based games
  consecutiveMisses?: number; // Number of consecutive zero-point turns
  eliminated?: boolean; // True if eliminated after three misses
}

/**
 * Represents a team in team-based games
 */
export interface Team {
  id: string;
  name: string;
  players: Player[];
  score: number;
  penalties: number;
  isActive: boolean;
  consecutiveMisses?: number; // Number of consecutive zero-point turns for the team
  eliminated?: boolean; // True if team is eliminated after three misses
}

/**
 * Represents a penalty record for tracking rule violations
 */
export interface PenaltyRecord {
  playerId: string;
  playerName: string;
  teamId?: string; // Optional team ID for team-based penalties
  teamName?: string; // Optional team name for team-based penalties
  timestamp: Date;
  reason: string;
}

/**
 * Represents a complete game with all its data
 */
export interface Game {
  id: string;
  players: Player[];
  teams?: Team[]; // Optional teams for team-based games
  winner: Player | null;
  winningTeam?: Team | null; // Optional winning team for team-based games
  startTime: Date;
  endTime: Date | null;
  totalRounds: number;
  penalties: PenaltyRecord[];
  gameMode: GameMode;
}

/**
 * Game modes
 */
export type GameMode = "individual" | "team";

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
  teams?: Team[]; // Optional teams for team-based games
  currentPlayerIndex: number;
  currentTeamIndex?: number; // Optional current team index for team-based games
  gameHistory: Game[];
  currentGame: Game | null;
  gameMode: GameMode;
}

/**
 * Error types for the application
 */
export enum ErrorType {
  DUPLICATE_PLAYER = "duplicate_player",
  DUPLICATE_TEAM = "duplicate_team",
  INVALID_SCORE = "invalid_score",
  STORAGE_ERROR = "storage_error",
  GAME_STATE_ERROR = "game_state_error",
  TEAM_ERROR = "team_error",
}

/**
 * Interface for error handling
 */
export interface ErrorHandler {
  showError(type: ErrorType, message: string): void;
  clearError(): void;
}
