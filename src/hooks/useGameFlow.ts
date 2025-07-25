/**
 * Custom hook for game flow management
 * Provides functions for controlling game state transitions and gameplay
 *
 * @format
 */

import { useCallback } from "preact/hooks";
import { useGameContext } from "../context/GameContext";
import { findWinner, getPointsNeeded } from "../utils/gameStateUtils";
import type { Player, GameState } from "../utils/types";

export interface UseGameFlowReturn {
  gameState: GameState;
  currentPlayer: Player | null;
  currentPlayerIndex: number;
  canStartGame: boolean;
  winner: Player | null;
  startGame: () => { success: boolean; error?: string };
  submitScore: (score: number, scoringType: "single" | "multiple") => { success: boolean; error?: string };
  applyPenalty: (reason?: string) => { success: boolean; error?: string };
  nextTurn: () => { success: boolean; error?: string };
  endGame: () => { success: boolean; error?: string };
  newGame: () => { success: boolean; error?: string };
  resetGame: () => { success: boolean; error?: string };
  getPointsNeededForPlayer: (playerId: string) => number;
  isPlayerTurn: (playerId: string) => boolean;
}

/**
 * Hook for managing game flow and state transitions
 */
export function useGameFlow(): UseGameFlowReturn {
  const { state, dispatch } = useGameContext();

  // Get current player
  const currentPlayer = state.players[state.currentPlayerIndex] || null;
  
  // Debug logging
  console.log(`[useGameFlow] Current player calculation:`, {
    currentPlayerIndex: state.currentPlayerIndex,
    playersCount: state.players.length,
    currentPlayer: currentPlayer?.name,
    gameState: state.gameState,
    players: state.players.map(p => ({ name: p.name, isActive: p.isActive, eliminated: p.eliminated }))
  });

  // Check if game can be started (minimum 2 players)
  const canStartGame = state.gameState === "setup" && state.players.length >= 2;

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

      try {
        dispatch({
          type: "SUBMIT_SCORE",
          payload: { playerId: currentPlayer.id, score, scoringType },
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: "Failed to submit score",
        };
      }
    },
    [state.gameState, currentPlayer, dispatch]
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
   * Reset the entire game state
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

  return {
    gameState: state.gameState,
    currentPlayer,
    currentPlayerIndex: state.currentPlayerIndex,
    canStartGame,
    winner,
    startGame,
    submitScore,
    applyPenalty,
    nextTurn,
    endGame,
    newGame,
    resetGame,
    getPointsNeededForPlayer,
    isPlayerTurn,
  };
}
