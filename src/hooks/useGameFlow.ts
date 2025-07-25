/**
 * Custom hook for game flow management
 * Provides functions for controlling game state transitions and gameplay
 *
 * @format
 */

import { useCallback } from "preact/hooks";
import { useGameContext } from "../context/GameContext";
import { findWinner, findWinningTeam, getPointsNeeded, getTeamPointsNeeded } from "../utils/gameStateUtils";
import type { Player, Team, GameState, GameMode } from "../utils/types";

export interface UseGameFlowReturn {
  gameState: GameState;
  gameMode: GameMode;
  currentPlayer: Player | null;
  currentTeam: Team | null;
  currentTeamPlayer: Player | null;
  currentPlayerIndex: number;
  currentTeamIndex: number;
  canStartGame: boolean;
  winner: Player | null;
  winningTeam: Team | null;
  startGame: () => { success: boolean; error?: string };
  submitScore: (score: number, scoringType: "single" | "multiple") => { success: boolean; error?: string };
  submitTeamScore: (score: number, scoringType: "single" | "multiple") => { success: boolean; error?: string };
  applyPenalty: (reason?: string) => { success: boolean; error?: string };
  applyTeamPenalty: (reason?: string) => { success: boolean; error?: string };
  nextTurn: () => { success: boolean; error?: string };
  endGame: () => { success: boolean; error?: string };
  newGame: () => { success: boolean; error?: string };
  resetGame: () => { success: boolean; error?: string };
  resetToSetup: () => { success: boolean; error?: string };
  getPointsNeededForPlayer: (playerId: string) => number;
  getPointsNeededForTeam: (teamId: string) => number;
  isPlayerTurn: (playerId: string) => boolean;
  isTeamTurn: (teamId: string) => boolean;
}

/**
 * Hook for managing game flow and state transitions
 */
export function useGameFlow(): UseGameFlowReturn {
  const { state, dispatch } = useGameContext();

  // Get current player
  const currentPlayer = state.players[state.currentPlayerIndex] || null;
  
  // Get current team for team games
  const currentTeam = state.teams && state.currentTeamIndex !== undefined 
    ? state.teams[state.currentTeamIndex] || null 
    : null;

  // Get current player within the current team
  const currentTeamPlayer = currentTeam && currentTeam.currentPlayerIndex !== undefined
    ? currentTeam.players[currentTeam.currentPlayerIndex] || null
    : null;
  
  // Debug logging
  console.log(`[useGameFlow] Current player calculation:`, {
    currentPlayerIndex: state.currentPlayerIndex,
    playersCount: state.players.length,
    currentPlayer: currentPlayer?.name,
    gameState: state.gameState,
    players: state.players.map(p => ({ name: p.name, isActive: p.isActive, eliminated: p.eliminated }))
  });

  // Check if game can be started (minimum 2 players for individual, 2 teams for team mode)
  const canStartGame = state.gameState === "setup" && 
    (state.gameMode === "individual" ? state.players.length >= 2 : (state.teams?.length || 0) >= 2);

  // Find winner if game is finished
  const winner =
    state.gameState === "finished" 
      ? (state.currentGame?.winner || findWinner(state.players))
      : null;
      
  // Debug logging for winner calculation
  if (state.gameState === "finished") {
    console.log(`[useGameFlow] Winner calculation:`, {
      gameState: state.gameState,
      currentGameWinner: state.currentGame?.winner,
      findWinnerResult: findWinner(state.players),
      finalWinner: winner
    });
  }

  /**
   * Start a new game
   */
  const startGame = useCallback((): { success: boolean; error?: string } => {
    if (!canStartGame) {
      return {
        success: false,
        error:
          state.players.length < 2
            ? "Need at least 2 players to start game"
            : "Game cannot be started in current state",
      };
    }

    try {
      dispatch({ type: "START_GAME" });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to start game",
      };
    }
  }, [canStartGame, state.players.length, dispatch]);

  /**
   * Submit a score for the current player
   */
  const submitScore = useCallback(
    (score: number, scoringType: "single" | "multiple"): { success: boolean; error?: string } => {
      if (state.gameState !== "playing") {
        return {
          success: false,
          error: "Cannot submit score when game is not active",
        };
      }

      if (state.gameMode === "team") {
        if (!currentTeam) {
          return { success: false, error: "No current team found" };
        }
        dispatch({
          type: "SUBMIT_TEAM_SCORE",
          payload: { teamId: currentTeam.id, score, scoringType },
        });
      } else {
        if (!currentPlayer) {
          return {
            success: false,
            error: "No current player found",
          };
        }

        if (score < 0 || score > 50) {
          return {
            success: false,
            error: "Score must be between 0 and 50",
          };
        }

        dispatch({
          type: "SUBMIT_SCORE",
          payload: { playerId: currentPlayer.id, score, scoringType },
        });
      }
      return { success: true };
    },
    [state.gameState, state.gameMode, currentPlayer, currentTeam, dispatch]
  );

  /**
   * Apply a penalty to the current player
   */
  const applyPenalty = useCallback(
    (reason = "Rule violation"): { success: boolean; error?: string } => {
      if (state.gameState !== "playing") {
        return {
          success: false,
          error: "Cannot apply penalty when game is not active",
        };
      }

      if (!currentPlayer) {
        return {
          success: false,
          error: "No current player found",
        };
      }

      try {
        dispatch({
          type: "APPLY_PENALTY",
          payload: { playerId: currentPlayer.id, reason },
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: "Failed to apply penalty",
        };
      }
    },
    [state.gameState, currentPlayer, dispatch]
  );

  /**
   * Move to the next player's turn
   */
  const nextTurn = useCallback((): { success: boolean; error?: string } => {
    if (state.gameState !== "playing") {
      return {
        success: false,
        error: "Cannot advance turn when game is not active",
      };
    }

    try {
      dispatch({ type: "NEXT_TURN" });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to advance to next turn",
      };
    }
  }, [state.gameState, dispatch]);

  /**
   * End the current game
   */
  const endGame = useCallback((): { success: boolean; error?: string } => {
    if (state.gameState !== "playing") {
      return {
        success: false,
        error: "Cannot end game when not playing",
      };
    }

    const gameWinner = findWinner(state.players);
    if (!gameWinner) {
      return {
        success: false,
        error: "Cannot end game without a winner",
      };
    }

    try {
      dispatch({ type: "END_GAME", payload: gameWinner });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to end game",
      };
    }
  }, [state.gameState, state.players, dispatch]);

  /**
   * Start a new game with the same players
   */
  const newGame = useCallback((): { success: boolean; error?: string } => {
    if (state.gameState !== "finished") {
      return {
        success: false,
        error: "Can only start new game after current game is finished",
      };
    }

    try {
      dispatch({ type: "NEW_GAME" });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to start new game",
      };
    }
  }, [state.gameState, dispatch]);

  /**
   * Reset the entire game state (wipes out all players)
   */
  const resetGame = useCallback((): { success: boolean; error?: string } => {
    try {
      dispatch({ type: "RESET_STATE" });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to reset game",
      };
    }
  }, [dispatch]);

  /**
   * Reset to setup while preserving players and teams
   */
  const resetToSetup = useCallback((): { success: boolean; error?: string } => {
    try {
      dispatch({ type: "RESET_TO_SETUP" });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to reset to setup",
      };
    }
  }, [dispatch]);

  /**
   * Get points needed for a specific player to reach 50
   */
  const getPointsNeededForPlayer = useCallback(
    (playerId: string): number => {
      const player = state.players.find((p) => p.id === playerId);
      return player ? getPointsNeeded(player) : 0;
    },
    [state.players]
  );

  /**
   * Check if it's a specific player's turn
   */
  const isPlayerTurn = useCallback(
    (playerId: string): boolean => {
      return currentPlayer?.id === playerId;
    },
    [currentPlayer]
  );

  // Find winning team if game is finished
  const winningTeam = state.gameState === "finished" && state.teams
    ? (state.currentGame?.winningTeam || findWinningTeam(state.teams))
    : null;

  return {
    gameState: state.gameState,
    gameMode: state.gameMode,
    currentPlayer,
    currentTeam,
    currentTeamPlayer,
    currentPlayerIndex: state.currentPlayerIndex,
    currentTeamIndex: state.currentTeamIndex || 0,
    canStartGame,
    winner,
    winningTeam,
    startGame,
    submitScore,
    submitTeamScore: submitScore, // Use the same function for both individual and team
    applyPenalty,
    applyTeamPenalty: applyPenalty, // Use the same function for both individual and team
    nextTurn,
    endGame,
    newGame,
    resetGame,
    resetToSetup,
    getPointsNeededForPlayer,
    getPointsNeededForTeam: (teamId: string) => {
      const team = state.teams?.find(t => t.id === teamId);
      return team ? getTeamPointsNeeded(team) : 0;
    },
    isPlayerTurn,
    isTeamTurn: (teamId: string) => currentTeam?.id === teamId,
  };
}
