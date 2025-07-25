/**
 * GameHistory Component
 * Displays modal/overlay for game history with winner, scores, duration, and penalties
 *
 * @format
 */

import { useGameHistory } from "../../hooks/useGameHistory";
import type { Game } from "../../utils/types";

interface GameHistoryProps {
  isVisible: boolean;
  onClose: () => void;
}

export function GameHistory({ isVisible, onClose }: GameHistoryProps) {
  const {
    gameHistory,
    getGameDuration,
    getPenaltiesForGame,
    getOverallStats,
    clearHistory,
    exportHistory,
  } = useGameHistory();

  const stats = getOverallStats();

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Handle export functionality
  const handleExport = () => {
    const dataStr = exportHistory();
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `molkky-game-history-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle clear history with confirmation
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all game history? This action cannot be undone.")) {
      const result = clearHistory();
      if (!result.success) {
        alert("Failed to clear history: " + result.error);
      }
    }
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal on escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Game History</h2>
            <p className="text-gray-600 text-xs sm:text-sm">
              {gameHistory.length} completed game{gameHistory.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 touch-manipulation"
            aria-label="Close history"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-140px)]">
          {/* Statistics Summary */}
          {gameHistory.length > 0 && (
            <div className="p-3 sm:p-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">📊 Overall Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                  <div className="text-xs sm:text-sm text-blue-700">Total Games</div>
                </div>
                <div className="bg-red-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.totalPenalties}</div>
                  <div className="text-xs sm:text-sm text-red-700">Total Penalties</div>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {Math.round(stats.averageGameDuration)}
                  </div>
                  <div className="text-xs sm:text-sm text-green-700">Avg Duration (min)</div>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {stats.mostPenalizedPlayer ? stats.mostPenalizedPlayer.split(" ")[0] : "N/A"}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-700">Most Penalized</div>
                </div>
              </div>
            </div>
          )}

          {/* Game List */}
          <div className="p-3 sm:p-6">
            {gameHistory.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📝</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Games Yet</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Complete your first game to see it appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {gameHistory.map((game: Game) => {
                  const duration = getGameDuration(game);
                  const penalties = getPenaltiesForGame(game.id);
                  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);

                  return (
                    <div key={game.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      {/* Game Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                          <div className="text-xl sm:text-2xl">🎮</div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                              Game #{gameHistory.indexOf(game) + 1}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {formatDate(game.startTime)}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs sm:text-sm text-gray-600">
                            Duration: {formatDuration(duration)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {game.totalRounds} rounds
                          </div>
                        </div>
                      </div>

                      {/* Winner */}
                      {game.winner && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl sm:text-2xl">🏆</span>
                            <div>
                              <span className="font-semibold text-green-800 text-sm sm:text-base">
                                Winner: {game.winner.name}
                              </span>
                              <div className="text-xs sm:text-sm text-green-700">
                                Final Score: {game.winner.score} points
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Player Scores */}
                      <div className="mb-3">
                        <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Final Scores:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sortedPlayers.map((player, index) => (
                            <div
                              key={player.id}
                              className={`grid grid-cols-4 gap-4 p-2 rounded-lg mb-1 ${
                                player.eliminated
                                  ? "bg-gray-200 border border-gray-300 opacity-60"
                                  : "bg-white border border-gray-200"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-gray-600">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className={`font-semibold ${player.eliminated ? "text-gray-400" : "text-gray-800"}`}>
                                  {player.name}
                                </span>
                                {player.eliminated && (
                                  <span className="ml-2 text-xs bg-gray-300 text-gray-600 px-2 py-1 rounded-full">
                                    Eliminated
                                  </span>
                                )}
                              </div>
                              <div className={`text-center font-bold ${player.eliminated ? "text-gray-400" : "text-gray-700"}`}>
                                {player.score}
                              </div>
                              {player.penalties > 0 ? (
                                <span className={player.eliminated ? "text-gray-400" : "text-red-600 font-medium"}>{player.penalties}</span>
                              ) : (
                                <span className={player.eliminated ? "text-gray-300" : "text-gray-400"}>-</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Penalties */}
                      {penalties.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Penalties Applied:</h5>
                          <div className="space-y-1">
                            {penalties.map((penalty, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs sm:text-sm">
                                <span className="text-red-500">⚠️</span>
                                <span className="text-gray-800 font-medium">
                                  {penalty.playerName}
                                </span>
                                <span className="text-gray-600">
                                  - {penalty.reason || "Score reset to 25"}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {formatDate(penalty.timestamp)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {gameHistory.length > 0 && (
          <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleExport}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                📥 Export History
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                🗑️ Clear History
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
