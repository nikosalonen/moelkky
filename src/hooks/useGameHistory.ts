/**
 * Custom hook for game history management
 * Provides functions for accessing and managing game history
 *
 * @format
 */

import { useCallback } from "preact/hooks";
import { useGameContext } from "../context/GameContext";
import { sessionStorageUtil } from "../utils/storage/sessionStorage";
import type { Game, PenaltyRecord } from "../utils/types";

export interface GameHistoryStats {
  totalGames: number;
  totalPenalties: number;
  averageGameDuration: number; // in minutes
  playerWinCounts: Record<string, number>;
  mostPenalizedPlayer: string | null;
}

export interface UseGameHistoryReturn {
  gameHistory: Game[];
  currentGame: Game | null;
  getGameById: (id: string) => Game | undefined;
  getGamesByPlayer: (playerName: string) => Game[];
  getPlayerStats: (playerName: string) => {
    gamesPlayed: number;
    gamesWon: number;
    totalPenalties: number;
    winRate: number;
  };
  getOverallStats: () => GameHistoryStats;
  clearHistory: () => { success: boolean; error?: string };
  exportHistory: () => string;
  getGameDuration: (game: Game) => number; // in minutes
  getPenaltiesForGame: (gameId: string) => PenaltyRecord[];
}

/**
 * Hook for managing game history and statistics
 */
export function useGameHistory(): UseGameHistoryReturn {
  const { state } = useGameContext();

  /**
   * Get a specific game by ID
   */
  const getGameById = useCallback(
    (id: string): Game | undefined => {
      return state.gameHistory.find((game) => game.id === id);
    },
    [state.gameHistory]
  );

  /**
   * Get all games where a specific player participated
   */
  const getGamesByPlayer = useCallback(
    (playerName: string): Game[] => {
      return state.gameHistory.filter((game) =>
        game.players.some((player) => player.name === playerName)
      );
    },
    [state.gameHistory]
  );

  /**
   * Get statistics for a specific player
   */
  const getPlayerStats = useCallback(
    (playerName: string) => {
      const playerGames = getGamesByPlayer(playerName);
      const gamesWon = playerGames.filter(
        (game) => game.winner?.name === playerName
      ).length;
      const totalPenalties = playerGames.reduce((total, game) => {
        return (
          total +
          game.penalties.filter((penalty) => penalty.playerName === playerName)
            .length
        );
      }, 0);

      return {
        gamesPlayed: playerGames.length,
        gamesWon,
        totalPenalties,
        winRate:
          playerGames.length > 0 ? (gamesWon / playerGames.length) * 100 : 0,
      };
    },
    [getGamesByPlayer]
  );

  /**
   * Get overall statistics for all games
   */
  const getOverallStats = useCallback((): GameHistoryStats => {
    const totalGames = state.gameHistory.length;
    const totalPenalties = state.gameHistory.reduce(
      (total, game) => total + game.penalties.length,
      0
    );

    // Calculate average game duration
    const completedGames = state.gameHistory.filter((game) => game.endTime);
    const totalDuration = completedGames.reduce((total, game) => {
      return total + getGameDuration(game);
    }, 0);
    const averageGameDuration =
      completedGames.length > 0 ? totalDuration / completedGames.length : 0;

    // Calculate player win counts
    const playerWinCounts: Record<string, number> = {};
    state.gameHistory.forEach((game) => {
      if (game.winner) {
        playerWinCounts[game.winner.name] =
          (playerWinCounts[game.winner.name] || 0) + 1;
      }
    });

    // Find most penalized player
    const playerPenaltyCounts: Record<string, number> = {};
    state.gameHistory.forEach((game) => {
      game.penalties.forEach((penalty) => {
        playerPenaltyCounts[penalty.playerName] =
          (playerPenaltyCounts[penalty.playerName] || 0) + 1;
      });
    });

    const mostPenalizedPlayer = Object.keys(playerPenaltyCounts).reduce(
      (mostPenalized, playerName) => {
        return !mostPenalized ||
          playerPenaltyCounts[playerName] > playerPenaltyCounts[mostPenalized]
          ? playerName
          : mostPenalized;
      },
      null as string | null
    );

    return {
      totalGames,
      totalPenalties,
      averageGameDuration,
      playerWinCounts,
      mostPenalizedPlayer,
    };
  }, [state.gameHistory]);

  /**
   * Clear all game history
   */
  const clearHistory = useCallback((): { success: boolean; error?: string } => {
    try {
      sessionStorageUtil.clearAll();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to clear game history",
      };
    }
  }, []);

  /**
   * Export game history as JSON string
   */
  const exportHistory = useCallback((): string => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalGames: state.gameHistory.length,
      games: state.gameHistory,
      stats: getOverallStats(),
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.gameHistory, getOverallStats]);

  /**
   * Calculate game duration in minutes
   */
  const getGameDuration = useCallback((game: Game): number => {
    if (!game.endTime) return 0;

    const startTime = new Date(game.startTime).getTime();
    const endTime = new Date(game.endTime).getTime();
    return Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
  }, []);

  /**
   * Get all penalties for a specific game
   */
  const getPenaltiesForGame = useCallback(
    (gameId: string): PenaltyRecord[] => {
      const game = getGameById(gameId);
      return game ? game.penalties : [];
    },
    [getGameById]
  );

  return {
    gameHistory: state.gameHistory,
    currentGame: state.currentGame,
    getGameById,
    getGamesByPlayer,
    getPlayerStats,
    getOverallStats,
    clearHistory,
    exportHistory,
    getGameDuration,
    getPenaltiesForGame,
  };
}
