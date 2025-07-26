/**
 * PlayerManager Component
 * Handles player addition, modification, and removal with validation
 *
 * @format
 */

import { useState } from "preact/hooks";
import type { Player } from "../../utils/types";
import { validatePlayerName } from "../../utils/validation";
import { useGameContext } from "../../context/GameContext";
import { useToast } from "../Toast";
import { InlineSpinner } from "../LoadingSpinner";

interface PlayerManagerProps {
  players: Player[];
  onPlayersChange?: (players: Player[]) => void;
  gameActive: boolean;
}

export function PlayerManager({ players, gameActive }: PlayerManagerProps) {
  const { dispatch } = useGameContext();
  const { addToast } = useToast();
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear error after a delay
  const clearError = () => {
    setTimeout(() => setError(null), 3000);
  };

  // Generate unique ID for new players
  const generatePlayerId = (): string => {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle adding a new player
  const handleAddPlayer = async () => {
    if (isSubmitting) return;

    const validation = validatePlayerName(newPlayerName, players);

    if (!validation.isValid) {
      setError(validation.error || "Invalid player name");
      addToast({
        type: "error",
        title: "Invalid Player Name",
        message: validation.error || "Invalid player name",
      });
      clearError();
      return;
    }

    setIsSubmitting(true);

    try {
      const newPlayer: Player = {
        id: generatePlayerId(),
        name: newPlayerName.trim(),
        score: 0,
        penalties: 0,
        isActive: false,
      };

      dispatch({ type: "ADD_PLAYER", payload: newPlayer });
      setNewPlayerName("");
      setError(null);
      
      addToast({
        type: "success",
        title: "Player Added",
        message: `Player "${newPlayer.name}" has been added successfully.`,
      });
    } catch (err) {
      const errorMessage = "Failed to add player. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Add Player",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting to edit a player name
  const handleStartEdit = (player: Player) => {
    if (gameActive) return;

    setEditingPlayer(player.id);
    setEditingName(player.name);
    setError(null);
  };

  // Handle saving edited player name
  const handleSaveEdit = async () => {
    if (!editingPlayer || isSubmitting) return;

    const otherPlayers = players.filter((p) => p.id !== editingPlayer);
    const validation = validatePlayerName(editingName, otherPlayers);

    if (!validation.isValid) {
      setError(validation.error || "Invalid player name");
      addToast({
        type: "error",
        title: "Invalid Player Name",
        message: validation.error || "Invalid player name",
      });
      clearError();
      return;
    }

    setIsSubmitting(true);

    try {
      dispatch({
        type: "UPDATE_PLAYER",
        payload: {
          id: editingPlayer,
          updates: { name: editingName.trim() },
        },
      });

      setEditingPlayer(null);
      setEditingName("");
      setError(null);
      
      addToast({
        type: "success",
        title: "Player Updated",
        message: `Player name has been updated successfully.`,
      });
    } catch (err) {
      const errorMessage = "Failed to update player. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Update Player",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditingName("");
    setError(null);
  };

  // Handle removing a player
  const handleRemovePlayer = async (playerId: string) => {
    if (gameActive || isSubmitting) return;

    const playerToRemove = players.find(p => p.id === playerId);
    if (!playerToRemove) return;

    setIsSubmitting(true);

    try {
      dispatch({ type: "REMOVE_PLAYER", payload: playerId });
      setShowDeleteConfirm(null);
      
      addToast({
        type: "info",
        title: "Player Removed",
        message: `Player "${playerToRemove.name}" has been removed.`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to Remove Player",
        message: "Failed to remove player. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key press events
  const handleKeyPress = (e: KeyboardEvent, action: "add" | "edit") => {
    if (e.key === "Enter") {
      if (action === "add") {
        handleAddPlayer();
      } else if (action === "edit") {
        handleSaveEdit();
      }
    } else if (e.key === "Escape" && action === "edit") {
      handleCancelEdit();
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6 mobile-card">
      <h2 class="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center mobile-text-lg">Players</h2>

      {/* Error Display */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          class="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-3 sm:mb-4 text-sm"
        >
          <span class="block sm:inline">{error}</span>
        </div>
      )}

      {/* Mobile-optimized Add Player Section */}
      {!gameActive && (
        <div class="mb-3 sm:mb-6">
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              aria-label="Player name"
              value={newPlayerName}
              onInput={(e) =>
                setNewPlayerName((e.target as HTMLInputElement).value)
              }
              onKeyDown={(e) => handleKeyPress(e, "add")}
              placeholder="Enter player name"
              class="mobile-input flex-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              maxLength={50}
              disabled={gameActive}
            />
            <button
              aria-label="Add player"
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim() || gameActive || isSubmitting}
              class="mobile-btn bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[100px] font-medium transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <InlineSpinner size="sm" variant="primary" />
                  <span className="ml-2">Adding...</span>
                </>
              ) : (
                "Add Player"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile-optimized Players List */}
      <div class="space-y-2 sm:space-y-3 mobile-player-list">
        {players.length === 0 ? (
          <p class="text-gray-500 text-center py-4 text-xs sm:text-base mobile-text-sm">
            No players added yet. Add at least 2 players to start a game.
          </p>
        ) : (
          players.map((player, index) => (
            <div
              key={player.id}
              class={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3 rounded-lg border ${
                player.isActive
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div class="flex items-center space-x-3 mb-2 sm:mb-0">
                <span class="text-sm font-medium text-gray-500 min-w-[20px]">
                  {index + 1}.
                </span>

                {editingPlayer === player.id ? (
                  <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                    <input
                      type="text"
                      aria-label="Edit player name"
                      value={editingName}
                      onInput={(e) =>
                        setEditingName((e.target as HTMLInputElement).value)
                      }
                      onKeyDown={(e) => handleKeyPress(e, "edit")}
                      class="flex-1 px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      maxLength={50}
                      autoFocus
                    />
                    <div class="flex space-x-2">
                      <button
                        aria-label="Save player name"
                        onClick={handleSaveEdit}
                        disabled={isSubmitting}
                        class="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <InlineSpinner size="sm" variant="primary" />
                            <span className="ml-1">Saving...</span>
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        aria-label="Cancel player name edit"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                        class="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                    <span
                      class={`font-medium text-sm sm:text-base ${
                        player.isActive ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {player.name}
                    </span>
                    <div class="flex flex-wrap gap-1 sm:gap-2">
                      {player.isActive && (
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Current Turn
                        </span>
                      )}
                      {gameActive && (
                        <span class="text-xs sm:text-sm text-gray-500">
                          Score: {player.score}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!gameActive && editingPlayer !== player.id && (
                <div class="flex items-center space-x-2 mt-2 sm:mt-0">
                  <button
                    aria-label="Edit player"
                    onClick={() => handleStartEdit(player)}
                    class="px-3 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
                  >
                    Edit
                  </button>
                  <button
                    aria-label="Delete player"
                    onClick={() => setShowDeleteConfirm(player.id)}
                    class="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg p-4 sm:p-6 max-w-sm mx-4 w-full">
            <h3 class="text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
              Confirm Removal
            </h3>
            <p class="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center">
              Are you sure you want to remove{" "}
              <span class="font-medium">
                {players.find((p) => p.id === showDeleteConfirm)?.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                class="px-4 py-3 sm:py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemovePlayer(showDeleteConfirm)}
                disabled={isSubmitting}
                class="px-4 py-3 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <InlineSpinner size="sm" variant="primary" />
                    <span className="ml-2">Removing...</span>
                  </>
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Count Info */}
      <div class="mt-4 text-xs sm:text-sm text-gray-600 text-center">
        {players.length === 1 && <p>Add 1 more player to start a game.</p>}
        {players.length >= 2 && !gameActive && (
          <p class="text-green-600">
            Ready to start! {players.length} players added.
          </p>
        )}
        {gameActive && (
          <p class="text-blue-600">
            Game in progress. Player management is disabled.
          </p>
        )}
      </div>
    </div>
  );
}
