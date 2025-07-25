/**
 * WinnerDisplay Component
 * Displays winner announcement with final scores and new game option
 *
 * @format
 */

import type { Player } from "../../utils/types";

interface WinnerDisplayProps {
  winner: Player;
  players: Player[];
  onNewGame: () => void;
}

export function WinnerDisplay({ winner, players, onNewGame }: WinnerDisplayProps) {
  // Sort players for display: winner first, then by score descending
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === winner.id) return -1;
    if (b.id === winner.id) return 1;
    return b.score - a.score;
  });

  // Get position suffix for ranking
  const getPositionSuffix = (position: number): string => {
    if (position === 1) return "st";
    if (position === 2) return "nd";
    if (position === 3) return "rd";
    return "th";
  };

  // Get medal emoji for top 3 positions
  const getMedalEmoji = (position: number): string => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return "";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
      {/* Winner Announcement */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="mb-4 sm:mb-4">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-2">
            {winner.name} Wins!
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-3 sm:mb-4 px-2">
            Congratulations on reaching exactly 50 points!
          </p>
          
          {/* Confetti-style decoration */}
          <div className="flex justify-center space-x-1 sm:space-x-2 text-lg sm:text-2xl mb-4 sm:mb-6">
            <span>🎊</span>
            <span>✨</span>
            <span>🏆</span>
            <span>✨</span>
            <span>🎊</span>
          </div>
        </div>

        {/* Winner's final stats */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 max-w-md mx-auto">
          <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2 text-center">
            🏆 Champion Stats
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">50</div>
              <div className="text-green-700">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{winner.penalties}</div>
              <div className="text-green-700">Penalties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Leaderboard */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
          Final Leaderboard
        </h3>
        
        {/* Mobile Layout */}
        <div className="block md:hidden space-y-2 sm:space-y-3">
          {sortedPlayers.map((player, index) => {
            const position = index + 1;
            const isWinner = player.id === winner.id;
            
            return (
              <div
                key={player.id}
                className={`p-3 sm:p-4 rounded-lg border-2 ${
                  isWinner
                    ? "bg-green-50 border-green-300"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-base sm:text-lg font-bold text-gray-600">
                        {position}{getPositionSuffix(position)}
                      </span>
                      <span className="text-base sm:text-lg">{getMedalEmoji(position)}</span>
                    </div>
                    <div>
                      <div className={`font-semibold text-sm sm:text-base ${isWinner ? "text-green-700" : "text-gray-800"}`}>
                        {player.name}
                        {isWinner && (
                          <span className="ml-1 sm:ml-2 text-xs bg-green-200 text-green-800 px-1 sm:px-2 py-1 rounded-full">
                            Winner
                          </span>
                        )}
                      </div>
                      {player.penalties > 0 && (
                        <div className="text-xs text-red-600">
                          {player.penalties} penalties
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold ${isWinner ? "text-green-600" : "text-gray-700"}`}>
                    {player.score}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 font-semibold text-gray-600 text-sm mb-3 pb-2 border-b border-gray-300">
              <div>Position</div>
              <div>Player</div>
              <div className="text-center">Score</div>
              <div className="text-center">Penalties</div>
            </div>
            
            {sortedPlayers.map((player, index) => {
              const position = index + 1;
              const isWinner = player.id === winner.id;
              
              return (
                <div
                  key={player.id}
                  className={`grid grid-cols-4 gap-4 p-3 rounded-lg mb-2 ${
                    isWinner
                      ? "bg-green-100 border border-green-300"
                      : player.eliminated
                        ? "bg-gray-200 border border-gray-300 opacity-60"
                        : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-600">
                      {position}{getPositionSuffix(position)}
                    </span>
                    <span>{getMedalEmoji(position)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`font-semibold ${isWinner ? "text-green-700" : player.eliminated ? "text-gray-400" : "text-gray-800"}`}>
                      {player.name}
                    </span>
                    {isWinner && (
                      <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                        Winner
                      </span>
                    )}
                    {player.eliminated && (
                      <span className="ml-2 text-xs bg-gray-300 text-gray-600 px-2 py-1 rounded-full">
                        Eliminated
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-center font-bold ${isWinner ? "text-green-600" : player.eliminated ? "text-gray-400" : "text-gray-700"}`}>
                    {player.score}
                  </div>
                  
                  <div className="text-center">
                    {player.penalties > 0 ? (
                      <span className={player.eliminated ? "text-gray-400" : "text-red-600 font-medium"}>{player.penalties}</span>
                    ) : (
                      <span className={player.eliminated ? "text-gray-300" : "text-gray-400"}>-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center">
        <button
          onClick={onNewGame}
          className="px-6 sm:px-8 py-3 sm:py-3 bg-green-500 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          🎮 Start New Game
        </button>
        
        <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
          Start a new game with the same players
        </p>
      </div>
    </div>
  );
} 
