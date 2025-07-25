/**
 * GameBoard Component
 * Displays current game state, scores, and turn indicators
 *
 * @format
 */

import type { Player, GameState } from "../../utils/types";

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  gameState: GameState;
}

export function GameBoard({
  players,
  currentPlayerIndex,
  gameState,
}: GameBoardProps) {
  // Don't render if no players or not in playing/finished state
  if (players.length === 0 || (gameState !== "playing" && gameState !== "finished")) {
    return null;
  }

  // Calculate points needed to reach 50
  const getPointsNeeded = (score: number): number => {
    return Math.max(0, 50 - score);
  };

  // Get status text for player
  const getPlayerStatus = (player: Player, _index: number): string => {
    if (player.eliminated) {
      return "Eliminated";
    }
    if (gameState === "finished" && player.score === 50) {
      return "Winner!";
    }
    if (gameState === "playing" && player.isActive) {
      return "Current Turn";
    }
    return "";
  };

  // Get status color classes
  const getStatusClasses = (player: Player, _index: number): string => {
    if (player.eliminated) {
      return "bg-gray-200 text-gray-400 border-gray-300 opacity-60";
    }
    if (player.isActive) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (player.score === 50) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score === 50) return "text-green-600 font-bold";
    if (score > 40) return "text-orange-600 font-semibold";
    if (score > 30) return "text-yellow-600 font-medium";
    return "text-gray-700";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        Game Board
      </h2>

      {/* Mobile Layout - Stack cards vertically */}
      <div className="block md:hidden space-y-3 sm:space-y-4">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${getStatusClasses(
              player,
              index
            )}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold truncate">
                  {player.name}
                </h3>
                {getPlayerStatus(player, index) && (
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-current bg-opacity-20 mt-1">
                    {getPlayerStatus(player, index)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`text-xl sm:text-2xl font-bold ${getScoreColor(
                    player.score
                  )}`}
                >
                  {player.score}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">/ 50</div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-gray-600">
                Points needed: {getPointsNeeded(player.score)}
              </span>
              {player.penalties > 0 && (
                <span className="text-red-600 font-medium">
                  Penalties: {player.penalties}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Layout - Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getStatusClasses(
              player,
              index
            )}`}
          >
            <div className="text-center">
              <h3
                className="text-lg font-semibold mb-2 truncate"
                title={player.name}
              >
                {player.name}
              </h3>

              {getPlayerStatus(player, index) && (
                <div className="mb-3">
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-current bg-opacity-20 font-medium">
                    {getPlayerStatus(player, index)}
                  </span>
                </div>
              )}

              <div
                className={`text-3xl font-bold mb-2 ${getScoreColor(
                  player.score
                )}`}
              >
                {player.score}
                <span className="text-lg text-gray-500 font-normal"> / 50</span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="text-gray-600">
                  Need:{" "}
                  <span className="font-medium">
                    {getPointsNeeded(player.score)}
                  </span>
                </div>
                {player.penalties > 0 && (
                  <div className="text-red-600 font-medium">
                    Penalties: {player.penalties}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Game Progress Indicator */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-gray-600">
          <div className="mb-2 sm:mb-0 text-center sm:text-left">
            {gameState === "playing" ? (
              <>
                <span className="font-medium">Current Player:</span>{" "}
                <span className="text-blue-600 font-semibold">
                  {players[currentPlayerIndex]?.name || "Unknown"}
                </span>
              </>
            ) : (
              <span className="font-medium text-green-600">Game Completed</span>
            )}
          </div>
          <div className="text-center sm:text-right">
            <span className="font-medium">Players:</span> {players.length}
          </div>
        </div>
      </div>
    </div>
  );
}
