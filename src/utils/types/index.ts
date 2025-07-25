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
  teamId?: string; // Optional team ID for team-based games
}

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

export interface PenaltyRecord {
  playerId: string;
  playerName: string;
  teamId?: string; // Optional team ID for team-based penalties
  teamName?: string; // Optional team name for team-based penalties
  timestamp: Date;
  reason: string;
}

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

export type GameMode = "individual" | "team";
export type GameState = "setup" | "playing" | "finished";

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

export enum ErrorType {
  DUPLICATE_PLAYER = "duplicate_player",
  DUPLICATE_TEAM = "duplicate_team",
  INVALID_SCORE = "invalid_score",
  STORAGE_ERROR = "storage_error",
  GAME_STATE_ERROR = "game_state_error",
  TEAM_ERROR = "team_error",
}

export interface ErrorHandler {
  showError(type: ErrorType, message: string): void;
  clearError(): void;
}
