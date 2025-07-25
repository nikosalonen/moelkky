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

interface PlayerManagerProps {
  players: Player[];
  onPlayersChange?: (players: Player[]) => void;
  gameActive: boolean;
}

export function PlayerManager({ players, gameActive }: PlayerManagerProps) {
  const { dispatch } = useGameContext();
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Clear error after a delay
  const clearError = () => {
    setTimeout(() => setError(null), 3000);
  };

  // Generate unique ID for new players
  const generatePlayerId = (): string => {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle adding a new player
  const handleAddPlayer = () => {
    const validation = validatePlayerName(newPlayerName, players);

    if (!validation.isValid) {
      setError(validation.error || "Invalid player name");
      clearError();
      return;
    }

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
  };

  // Handle starting to edit a player name
  const handleStartEdit = (player: Player) => {
    if (gameActive) return;

    setEditingPlayer(player.id);
    setEditingName(player.name);
    setError(null);
  };

  // Handle saving edited player name
  const handleSaveEdit = () => {
    if (!editingPlayer) return;

    const otherPlayers = players.filter((p) => p.id !== editingPlayer);
    const validation = validatePlayerName(editingName, otherPlayers);

    if (!validation.isValid) {
      setError(validation.error || "Invalid player name");
      clearError();
      return;
    }

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
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditingName("");
    setError(null);
  };

  // Handle removing a player
  const handleRemovePlayer = (playerId: string) => {
    if (gameActive) return;

    dispatch({ type: "REMOVE_PLAYER", payload: playerId });
    setShowDeleteConfirm(null);
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
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Players</h2>

      {/* Error Display */}
      {error && (
        <div
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <span class="block sm:inline">{error}</span>
        </div>
      )}

      {/* Add Player Section */}
      {!gameActive && (
        <div class="mb-6">
          <div class="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newPlayerName}
              onInput={(e) =>
                setNewPlayerName((e.target as HTMLInputElement).value)
              }
              onKeyDown={(e) => handleKeyPress(e, "add")}
              placeholder="Enter player name"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={50}
              disabled={gameActive}
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim() || gameActive}
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[100px]"
            >
              Add Player
            </button>
          </div>
        </div>
      )}

      {/* Players List */}
      <div class="space-y-3">
        {players.length === 0 ? (
          <p class="text-gray-500 text-center py-4">
            No players added yet. Add at least 2 players to start a game.
          </p>
        ) : (
          players.map((player, index) => (
            <div
              key={player.id}
              class={`flex items-center justify-between p-3 rounded-lg border ${
                player.isActive
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div class="flex items-center space-x-3">
                <span class="text-sm font-medium text-gray-500 min-w-[20px]">
                  {index + 1}.
                </span>

                {editingPlayer === player.id ? (
                  <div class="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingName}
                      onInput={(e) =>
                        setEditingName((e.target as HTMLInputElement).value)
                      }
                      onKeyDown={(e) => handleKeyPress(e, "edit")}
                      class="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={50}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      class="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      class="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div class="flex items-center space-x-2">
                    <span
                      class={`font-medium ${
                        player.isActive ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {player.name}
                    </span>
                    {player.isActive && (
                      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Current Turn
                      </span>
                    )}
                    {gameActive && (
                      <span class="text-sm text-gray-500">
                        Score: {player.score}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!gameActive && editingPlayer !== player.id && (
                <div class="flex items-center space-x-2">
                  <button
                    onClick={() => handleStartEdit(player)}
                    class="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(player.id)}
                    class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
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
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">
              Confirm Removal
            </h3>
            <p class="text-gray-600 mb-6">
              Are you sure you want to remove{" "}
              <span class="font-medium">
                {players.find((p) => p.id === showDeleteConfirm)?.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div class="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemovePlayer(showDeleteConfirm)}
                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Count Info */}
      <div class="mt-4 text-sm text-gray-600">
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
