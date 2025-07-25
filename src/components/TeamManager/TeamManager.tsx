/**
 * TeamManager Component
 * Handles team creation, modification, and management for team-based games
 *
 * @format
 */

import { useState } from "preact/hooks";
import type { Team, Player } from "../../utils/types";
import { createTeam, validateTeamSetup } from "../../utils/gameStateUtils";
import { useGameContext } from "../../context/GameContext";
import { useToast } from "../Toast";
import { InlineSpinner } from "../LoadingSpinner";

interface TeamManagerProps {
  teams: Team[];
  players: Player[];
  gameActive: boolean;
  onTeamsChange?: (teams: Team[]) => void;
}

export function TeamManager({ teams, players, gameActive }: TeamManagerProps) {
  const { dispatch } = useGameContext();
  const { addToast } = useToast();
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [reorderingTeam, setReorderingTeam] = useState<string | null>(null);

  // Clear error after a delay
  const clearError = () => {
    setTimeout(() => setError(null), 3000);
  };

  // Generate unique ID for new teams
  const generateTeamId = (): string => {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get available players (not assigned to any team)
  const getAvailablePlayers = (): Player[] => {
    return players.filter(player => !teams.some(team => 
      team.players.some(teamPlayer => teamPlayer.id === player.id)
    ));
  };

  // Handle adding a new team
  const handleAddTeam = async () => {
    if (isSubmitting) return;

    if (!newTeamName.trim()) {
      setError("Team name is required");
      addToast({
        type: "error",
        title: "Invalid Team Name",
        message: "Team name is required",
      });
      clearError();
      return;
    }

    if (teams.some(team => team.name.toLowerCase() === newTeamName.trim().toLowerCase())) {
      setError("Team name already exists");
      addToast({
        type: "error",
        title: "Duplicate Team Name",
        message: "A team with this name already exists",
      });
      clearError();
      return;
    }

    if (selectedPlayers.length === 0) {
      setError("At least one player must be selected");
      addToast({
        type: "error",
        title: "No Players Selected",
        message: "At least one player must be selected for the team",
      });
      clearError();
      return;
    }

    if (selectedPlayers.length > 4) {
      setError("Maximum 4 players per team");
      addToast({
        type: "error",
        title: "Too Many Players",
        message: "Maximum 4 players allowed per team",
      });
      clearError();
      return;
    }

    setIsSubmitting(true);

    try {
      const teamPlayers = players.filter(player => selectedPlayers.includes(player.id));
      const newTeam = createTeam(newTeamName.trim(), teamPlayers);

      dispatch({ type: "ADD_TEAM", payload: newTeam });
      setNewTeamName("");
      setSelectedPlayers([]);
      setError(null);
      
      addToast({
        type: "success",
        title: "Team Added",
        message: `Team "${newTeam.name}" has been created successfully.`,
      });
    } catch (err) {
      const errorMessage = "Failed to create team. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Create Team",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting to edit a team name
  const handleStartEdit = (team: Team) => {
    if (gameActive) return;

    setEditingTeam(team.id);
    setEditingName(team.name);
    setError(null);
  };

  // Handle saving team name edit
  const handleSaveEdit = async () => {
    if (!editingTeam || isSubmitting) return;

    if (!editingName.trim()) {
      setError("Team name is required");
      return;
    }

    if (teams.some(team => team.id !== editingTeam && team.name.toLowerCase() === editingName.trim().toLowerCase())) {
      setError("Team name already exists");
      return;
    }

    setIsSubmitting(true);

    try {
      dispatch({
        type: "UPDATE_TEAM",
        payload: { teamId: editingTeam, updates: { name: editingName.trim() } }
      });
      
      setEditingTeam(null);
      setEditingName("");
      setError(null);
      
      addToast({
        type: "success",
        title: "Team Updated",
        message: `Team name has been updated successfully.`,
      });
    } catch (err) {
      const errorMessage = "Failed to update team. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Update Team",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling team name edit
  const handleCancelEdit = () => {
    setEditingTeam(null);
    setEditingName("");
    setError(null);
  };

  // Handle removing a team
  const handleRemoveTeam = async (teamId: string) => {
    if (gameActive) return;

    setIsSubmitting(true);

    try {
      dispatch({ type: "REMOVE_TEAM", payload: teamId });
      setShowDeleteConfirm(null);
      setError(null);
      
      addToast({
        type: "success",
        title: "Team Removed",
        message: "Team has been removed successfully.",
      });
    } catch (err) {
      const errorMessage = "Failed to remove team. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to Remove Team",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle key press events
  const handleKeyPress = (e: KeyboardEvent, action: "add" | "edit") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (action === "add") {
        handleAddTeam();
      } else if (action === "edit") {
        handleSaveEdit();
      }
    } else if (e.key === "Escape") {
      if (action === "edit") {
        handleCancelEdit();
      }
    }
  };

  // Handle player selection for team
  const handlePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Handle starting player reordering for a team
  const handleStartReorder = (team: Team) => {
    if (gameActive) return;
    setReorderingTeam(team.id);
  };

  // Handle canceling player reordering
  const handleCancelReorder = () => {
    setReorderingTeam(null);
  };

  // Handle moving a player up in the order
  const handleMovePlayerUp = (teamId: string, playerIndex: number) => {
    if (playerIndex === 0) return; // Already at the top

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    const newPlayers = [...team.players];
    const temp = newPlayers[playerIndex];
    newPlayers[playerIndex] = newPlayers[playerIndex - 1];
    newPlayers[playerIndex - 1] = temp;

    dispatch({
      type: "UPDATE_TEAM",
      payload: { teamId, updates: { players: newPlayers } }
    });

    addToast({
      type: "success",
      title: "Player Order Updated",
      message: `${temp.name} moved up in the order.`,
    });
  };

  // Handle moving a player down in the order
  const handleMovePlayerDown = (teamId: string, playerIndex: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || playerIndex === team.players.length - 1) return; // Already at the bottom

    const newPlayers = [...team.players];
    const temp = newPlayers[playerIndex];
    newPlayers[playerIndex] = newPlayers[playerIndex + 1];
    newPlayers[playerIndex + 1] = temp;

    dispatch({
      type: "UPDATE_TEAM",
      payload: { teamId, updates: { players: newPlayers } }
    });

    addToast({
      type: "success",
      title: "Player Order Updated",
      message: `${temp.name} moved down in the order.`,
    });
  };

  // Handle saving player reorder
  const handleSaveReorder = (teamId: string) => {
    setReorderingTeam(null);
    addToast({
      type: "success",
      title: "Player Order Saved",
      message: "Team player order has been updated.",
    });
  };

  const availablePlayers = getAvailablePlayers();
  const canStartTeamGame = validateTeamSetup(teams).isValid;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Team Management
      </h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Add New Team */}
      {!gameActive && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Create New Team</h3>
          
          {/* Team Name Input */}
          <div className="mb-4">
            <label htmlFor="newTeamName" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              id="newTeamName"
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName((e.target as HTMLInputElement).value)}
              onKeyPress={(e) => handleKeyPress(e, "add")}
              placeholder="Enter team name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Player Selection */}
          {availablePlayers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Players ({selectedPlayers.length}/4)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availablePlayers.map((player) => (
                  <label key={player.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handlePlayerSelection(player.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-gray-700">{player.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add Team Button */}
          <button
            onClick={handleAddTeam}
            disabled={isSubmitting || !newTeamName.trim() || selectedPlayers.length === 0}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isSubmitting || !newTeamName.trim() || selectedPlayers.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isSubmitting ? (
              <InlineSpinner size="sm" />
            ) : (
              "Create Team"
            )}
          </button>
        </div>
      )}

      {/* Teams List */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-700">
          Teams ({teams.length})
        </h3>
        
        {teams.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No teams created yet. Create at least 2 teams to start a team game.
          </p>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className="border border-gray-200 rounded-lg p-3 bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {editingTeam === team.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName((e.target as HTMLInputElement).value)}
                      onKeyPress={(e) => handleKeyPress(e, "edit")}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{team.name}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {team.players.length} player{team.players.length !== 1 ? "s" : ""}
                  </span>
                </div>
                
                {!gameActive && (
                  <div className="flex items-center space-x-2">
                    {editingTeam === team.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(team)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(team.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Team Players */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Players:</span>
                  {!gameActive && team.players.length > 1 && (
                    <div className="flex items-center space-x-2">
                      {reorderingTeam === team.id ? (
                        <>
                          <button
                            onClick={() => handleSaveReorder(team.id)}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Save Order
                          </button>
                          <button
                            onClick={handleCancelReorder}
                            className="text-gray-600 hover:text-gray-800 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartReorder(team)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Reorder
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {reorderingTeam === team.id ? (
                  // Reorderable player list
                  <div className="space-y-1">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 mb-2">
                      💡 Click the arrows to reorder players. The order determines throwing sequence.
                    </div>
                    {team.players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm text-gray-700 font-medium">
                          {index + 1}. {player.name}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleMovePlayerUp(team.id, index)}
                            disabled={index === 0}
                            className={`p-1 rounded text-xs transition-colors ${
                              index === 0
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            }`}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMovePlayerDown(team.id, index)}
                            disabled={index === team.players.length - 1}
                            className={`p-1 rounded text-xs transition-colors ${
                              index === team.players.length - 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            }`}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Regular player list
                  <div className="text-sm text-gray-600">
                    {team.players.map((player, index) => (
                      <span key={player.id}>
                        {index + 1}. {player.name}
                        {index < team.players.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === team.id && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700 mb-2">
                    Are you sure you want to remove this team?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRemoveTeam(team.id)}
                      disabled={isSubmitting}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      {isSubmitting ? <InlineSpinner size="sm" /> : "Yes, Remove"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Team Game Status */}
      {teams.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            {canStartTeamGame
              ? "✅ Ready to start team game"
              : `❌ Need ${Math.max(0, 2 - teams.length)} more team${teams.length === 1 ? "" : "s"} to start`}
          </p>
        </div>
      )}
    </div>
  );
} 
