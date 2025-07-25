/**
 * NoWinnerDisplay Component
 * Displays when a game ends without a winner (all players eliminated)
 * Provides option to reset and modify players
 *
 * @format
 */

import type { Player, Team } from "../../utils/types";

interface NoWinnerDisplayProps {
  players: Player[];
  teams?: Team[];
  gameMode: "individual" | "team";
  onReset: () => void;
}

export function NoWinnerDisplay({ players, teams, gameMode, onReset }: NoWinnerDisplayProps) {
  // Get eliminated players/teams for display
  const eliminatedPlayers = players.filter(p => p.eliminated);
  const eliminatedTeams = teams?.filter(t => t.eliminated) || [];

  // Get final scores for display
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const sortedTeams = teams ? [...teams].sort((a, b) => b.score - a.score) : [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
      {/* No Winner Announcement */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="mb-4 sm:mb-4">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">😔</div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-600 mb-2">
            Game Over
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-3 sm:mb-4 px-2">
            {gameMode === "individual" 
              ? "All players have been eliminated due to consecutive misses."
              : "All teams have been eliminated due to consecutive misses."
            }
          </p>
          
          {/* Sad decoration */}
          <div className="flex justify-center space-x-1 sm:space-x-2 text-lg sm:text-2xl mb-4 sm:mb-6">
            <span>💔</span>
            <span>🎯</span>
            <span>💔</span>
          </div>
        </div>

        {/* Elimination Summary */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 max-w-md mx-auto">
          <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2 text-center">
            🚫 Elimination Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {gameMode === "individual" ? eliminatedPlayers.length : eliminatedTeams.length}
              </div>
              <div className="text-red-700">
                {gameMode === "individual" ? "Players" : "Teams"} Eliminated
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {gameMode === "individual" ? players.length : teams?.length || 0}
              </div>
              <div className="text-red-700">
                {gameMode === "individual" ? "Total Players" : "Total Teams"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Leaderboard */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
          Final Standings
        </h3>
        
        {gameMode === "individual" ? (
          /* Individual Game Final Standings */
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 font-semibold text-gray-600 text-sm mb-3 pb-2 border-b border-gray-300">
              <div>Position</div>
              <div>Player</div>
              <div className="text-center">Score</div>
              <div className="text-center">Status</div>
            </div>
            
            {sortedPlayers.map((player, index) => {
              const position = index + 1;
              const isEliminated = player.eliminated;
              
              return (
                <div
                  key={player.id}
                  className={`grid grid-cols-4 gap-4 p-3 rounded-lg mb-2 ${
                    isEliminated
                      ? "bg-red-100 border border-red-300"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-600">
                      {position}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`font-semibold ${isEliminated ? "text-red-700" : "text-gray-800"}`}>
                      {player.name}
                    </span>
                    {isEliminated && (
                      <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                        Eliminated
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-center font-bold ${isEliminated ? "text-red-600" : "text-gray-700"}`}>
                    {player.score}
                  </div>
                  
                  <div className="text-center">
                    {isEliminated ? (
                      <span className="text-red-600 font-medium">Eliminated</span>
                    ) : (
                      <span className="text-gray-400">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Team Game Final Standings */
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 font-semibold text-gray-600 text-sm mb-3 pb-2 border-b border-gray-300">
              <div>Position</div>
              <div>Team</div>
              <div className="text-center">Score</div>
              <div className="text-center">Status</div>
            </div>
            
            {sortedTeams.map((team, index) => {
              const position = index + 1;
              const isEliminated = team.eliminated;
              
              return (
                <div
                  key={team.id}
                  className={`grid grid-cols-4 gap-4 p-3 rounded-lg mb-2 ${
                    isEliminated
                      ? "bg-red-100 border border-red-300"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-600">
                      {position}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`font-semibold ${isEliminated ? "text-red-700" : "text-gray-800"}`}>
                      {team.name}
                    </span>
                    {isEliminated && (
                      <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                        Eliminated
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-center font-bold ${isEliminated ? "text-red-600" : "text-gray-700"}`}>
                    {team.score}
                  </div>
                  
                  <div className="text-center">
                    {isEliminated ? (
                      <span className="text-red-600 font-medium">Eliminated</span>
                    ) : (
                      <span className="text-gray-400">Active</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="px-6 sm:px-8 py-3 sm:py-3 bg-blue-500 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          🔄 Reset & Modify Players
        </button>
        
        <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
          Go back to setup to modify players and start a new game with the same players
        </p>
      </div>
    </div>
  );
} 
