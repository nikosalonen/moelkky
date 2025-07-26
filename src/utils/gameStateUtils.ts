/**
 * Utility functions for game state management
 *
 * @format
 */

import type {
  Player,
  Game,
  GameState,
  PenaltyRecord,
  Team,
  GameMode,
} from "./types/index";

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
 * Creates a new team with default values
 * @param name - The team's name
 * @param players - Array of players in the team
 * @returns A new Team object
 */
export function createTeam(name: string, players: Player[] = []): Team {
  const teamId = generateId();
  return {
    id: teamId,
    name: name.trim(),
    players: players.map((player) => ({ ...player, teamId })),
    score: 0,
    penalties: 0,
    isActive: false,
  };
}

/**
 * Creates a new game with the given players
 * @param players - Array of players for the game
 * @param gameMode - The game mode (individual or team)
 * @param teams - Optional array of teams for team-based games
 * @returns A new Game object
 */
export function createGame(
  players: Player[],
  gameMode: GameMode = "individual",
  teams?: Team[]
): Game {
  return {
    id: generateId(),
    players: players.map((player) => ({ ...player, score: 0, penalties: 0 })),
    teams: teams?.map((team) => ({ ...team, score: 0, penalties: 0 })),
    winner: null,
    winningTeam: null,
    startTime: new Date(),
    endTime: null,
    totalRounds: 0,
    penalties: [],
    gameMode,
  };
}

/**
 * Creates a penalty record
 * @param playerId - The ID of the player receiving the penalty
 * @param playerName - The name of the player receiving the penalty
 * @param reason - The reason for the penalty
 * @param teamId - Optional team ID for team-based penalties
 * @param teamName - Optional team name for team-based penalties
 * @returns A new PenaltyRecord object
 */
export function createPenaltyRecord(
  playerId: string,
  playerName: string,
  reason: string = "Rule violation",
  teamId?: string,
  teamName?: string
): PenaltyRecord {
  return {
    playerId,
    playerName,
    teamId,
    teamName,
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
 * Applies a score to a team, handling Mölkky scoring rules and consecutive misses
 * @param team - The team to update
 * @param score - The score to add
 * @param currentPlayerId - The ID of the player who scored (optional)
 * @returns Updated team with new score and consecutive misses tracking
 */
export function applyTeamScore(
  team: Team,
  score: number,
  currentPlayerId?: string
): Team {
  const newScore = team.score + score;
  let updatedTeam = { ...team };

  // Handle consecutive misses for team
  if (score === 0) {
    const previousMisses = updatedTeam.consecutiveMisses || 0;
    updatedTeam.consecutiveMisses = previousMisses + 1;

    // Check if team should be eliminated (3 consecutive misses)
    if (updatedTeam.consecutiveMisses >= 3) {
      updatedTeam.eliminated = true;
    }
  } else {
    // Reset consecutive misses if team scores points
    updatedTeam.consecutiveMisses = 0;
  }

  // Update individual player scores within the team
  const updatedPlayers = team.players.map((player) => {
    if (currentPlayerId && player.id === currentPlayerId) {
      // Update the current player's score
      const playerNewScore = player.score + score;
      return {
        ...player,
        score: playerNewScore > 50 ? 25 : playerNewScore, // Apply Mölkky rule to individual player too
      };
    }
    return player;
  });

  // If score exceeds 50, reset to 25 (Mölkky rule)
  if (newScore > 50) {
    return {
      ...updatedTeam,
      score: 25,
      players: updatedPlayers,
    };
  }

  return {
    ...updatedTeam,
    score: newScore,
    players: updatedPlayers,
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
 * Applies a penalty to a team (resets score to 25)
 * @param team - The team to penalize
 * @returns Updated team with penalty applied
 */
export function applyTeamPenalty(team: Team): Team {
  return {
    ...team,
    score: 25,
    penalties: team.penalties + 1,
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
 * Checks if a team has won the game (score exactly 50)
 * @param team - The team to check
 * @returns True if the team has won
 */
export function hasTeamWon(team: Team): boolean {
  return team.score === 50;
}

/**
 * Gets the next player index in a round-robin fashion
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
 * Gets the next team index in a round-robin fashion
 * @param currentIndex - Current team index
 * @param totalTeams - Total number of teams
 * @returns Next team index
 */
export function getNextTeamIndex(
  currentIndex: number,
  totalTeams: number
): number {
  return (currentIndex + 1) % totalTeams;
}

/**
 * Gets the next player index within a team
 * @param currentIndex - Current player index within the team
 * @param totalPlayers - Total number of players in the team
 * @returns Next player index within the team
 */
export function getNextPlayerInTeam(
  currentIndex: number,
  totalPlayers: number
): number {
  return (currentIndex + 1) % totalPlayers;
}

/**
 * Gets the points needed for a player to win
 * @param player - The player to check
 * @returns Points needed to reach 50
 */
export function getPointsNeeded(player: Player): number {
  return Math.max(0, 50 - player.score);
}

/**
 * Gets the points needed for a team to win
 * @param team - The team to check
 * @returns Points needed to reach 50
 */
export function getTeamPointsNeeded(team: Team): number {
  return Math.max(0, 50 - team.score);
}

/**
 * Resets players for a new game
 * @param players - Array of players to reset
 * @returns Reset players
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
 * Resets teams for a new game
 * @param teams - Array of teams to reset
 * @returns Reset teams
 */
export function resetTeamsForNewGame(teams: Team[]): Team[] {
  return teams.map((team) => ({
    ...team,
    score: 0,
    penalties: 0,
    consecutiveMisses: 0,
    eliminated: false,
    currentPlayerIndex: 0,
    isActive: true,
    players: team.players.map((player: Player) => ({
      ...player,
      score: 0,
      penalties: 0,
      isActive: true,
    })),
  }));
}

/**
 * Reorders players by their previous scores (highest first)
 * @param players - Array of players to reorder
 * @returns Reordered players
 */
export function reorderPlayersByPreviousScores(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score);
}

/**
 * Reorders teams by their previous scores (highest first)
 * @param teams - Array of teams to reorder
 * @returns Reordered teams
 */
export function reorderTeamsByPreviousScores(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => b.score - a.score);
}

/**
 * Finds the winner among players
 * @param players - Array of players to check
 * @returns Winning player or null if no winner
 */
export function findWinner(players: Player[]): Player | null {
  return players.find((player) => hasPlayerWon(player)) || null;
}

/**
 * Finds the winning team among teams
 * @param teams - Array of teams to check
 * @returns Winning team or null if no winner
 */
export function findWinningTeam(teams: Team[]): Team | null {
  return teams.find((team) => hasTeamWon(team)) || null;
}

/**
 * Gets all players from teams
 * @param teams - Array of teams
 * @returns Array of all players from all teams
 */
export function getAllPlayersFromTeams(teams: Team[]): Player[] {
  return teams.flatMap((team) => team.players);
}

/**
 * Gets team by player ID
 * @param teams - Array of teams
 * @param playerId - Player ID to find
 * @returns Team containing the player or null
 */
export function getTeamByPlayerId(
  teams: Team[],
  playerId: string
): Team | null {
  return (
    teams.find((team) =>
      team.players.some((player) => player.id === playerId)
    ) || null
  );
}

/**
 * Validates team setup for game start
 * @param teams - Array of teams to validate
 * @returns Validation result
 */
export function validateTeamSetup(teams: Team[]): {
  isValid: boolean;
  error?: string;
} {
  if (teams.length < 2) {
    return {
      isValid: false,
      error: "Need at least 2 teams to start a team game",
    };
  }

  for (const team of teams) {
    if (team.players.length === 0) {
      return { isValid: false, error: `Team "${team.name}" has no players` };
    }
    if (team.players.length > 4) {
      return {
        isValid: false,
        error: `Team "${team.name}" has too many players (max 4)`,
      };
    }
  }

  return { isValid: true };
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
 * @param winner - The winning player (for individual games)
 * @param winningTeam - The winning team (for team games)
 * @returns Completed game
 */
export function completeGame(
  game: Game,
  winner: Player | null = null,
  winningTeam: Team | null = null
): Game {
  return {
    ...game,
    winner,
    winningTeam,
    endTime: new Date(),
  };
}

/**
 * Generates a unique ID for players and games
 * @returns A unique string ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
