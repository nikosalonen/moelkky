/**
 * Custom hook for player management operations
 * Provides functions for adding, updating, and removing players
 *
 * @format
 */

import { useCallback } from "preact/hooks";
import { useGameContext } from "../context/GameContext";
import { createPlayer } from "../utils/gameStateUtils";
import { validatePlayerName } from "../utils/validation";
import type { Player } from "../utils/types";

export interface UsePlayerManagementReturn {
  players: Player[];
  addPlayer: (name: string) => { success: boolean; error?: string };
  updatePlayer: (
    id: string,
    updates: Partial<Player>
  ) => { success: boolean; error?: string };
  removePlayer: (id: string) => { success: boolean; error?: string };
  canModifyPlayers: boolean;
  getPlayerById: (id: string) => Player | undefined;
  getPlayerByName: (name: string) => Player | undefined;
}

/**
 * Hook for managing players in the game
 */
export function usePlayerManagement(): UsePlayerManagementReturn {
  const { state, dispatch } = useGameContext();

  // Check if players can be modified (only in setup state)
  const canModifyPlayers = state.gameState === "setup";

  /**
   * Add a new player to the game
   */
  const addPlayer = useCallback(
    (name: string): { success: boolean; error?: string } => {
      if (!canModifyPlayers) {
        return {
          success: false,
          error: "Cannot modify players during active game",
        };
      }

      // Validate player name
      const validation = validatePlayerName(name, state.players);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      try {
        const newPlayer = createPlayer(name);
        dispatch({ type: "ADD_PLAYER", payload: newPlayer });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: "Failed to add player",
        };
      }
    },
    [canModifyPlayers, state.players, dispatch]
  );

  /**
   * Update an existing player
   */
  const updatePlayer = useCallback(
    (
      id: string,
      updates: Partial<Player>
    ): { success: boolean; error?: string } => {
      if (!canModifyPlayers && updates.name) {
        return {
          success: false,
          error: "Cannot modify player names during active game",
        };
      }

      const existingPlayer = state.players.find((p) => p.id === id);
      if (!existingPlayer) {
        return {
          success: false,
          error: "Player not found",
        };
      }

      // If updating name, validate it
      if (updates.name && updates.name !== existingPlayer.name) {
        const otherPlayers = state.players.filter((p) => p.id !== id);
        const validation = validatePlayerName(updates.name, otherPlayers);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error,
          };
        }
      }

      try {
        dispatch({ type: "UPDATE_PLAYER", payload: { id, updates } });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: "Failed to update player",
        };
      }
    },
    [canModifyPlayers, state.players, dispatch]
  );

  /**
   * Remove a player from the game
   */
  const removePlayer = useCallback(
    (id: string): { success: boolean; error?: string } => {
      if (!canModifyPlayers) {
        return {
          success: false,
          error: "Cannot remove players during active game",
        };
      }

      const existingPlayer = state.players.find((p) => p.id === id);
      if (!existingPlayer) {
        return {
          success: false,
          error: "Player not found",
        };
      }

      try {
        dispatch({ type: "REMOVE_PLAYER", payload: id });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: "Failed to remove player",
        };
      }
    },
    [canModifyPlayers, state.players, dispatch]
  );

  /**
   * Get a player by ID
   */
  const getPlayerById = useCallback(
    (id: string): Player | undefined => {
      return state.players.find((player) => player.id === id);
    },
    [state.players]
  );

  /**
   * Get a player by name
   */
  const getPlayerByName = useCallback(
    (name: string): Player | undefined => {
      return state.players.find((player) => player.name === name);
    },
    [state.players]
  );

  return {
    players: state.players,
    addPlayer,
    updatePlayer,
    removePlayer,
    canModifyPlayers,
    getPlayerById,
    getPlayerByName,
  };
}
