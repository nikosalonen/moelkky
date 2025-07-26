/**
 * GameBoard Component
 * Displays current game state, scores, and turn indicators
 *
 * @format
 */

import type { Player, GameState, Team, GameMode } from "../../utils/types";
import { ScoreInput } from "../ScoreInput/ScoreInput";

interface GamePlayPanelProps {
  players: Player[];
  teams?: Team[];
  currentPlayerIndex: number;
  currentTeamIndex?: number;
  gameState: GameState;
  gameMode: GameMode;
  currentPlayer: Player;
  currentTeam?: Team | null;
  currentTeamPlayer?: Player | null;
  onScoreSubmit: (playerId: string, score: number, scoringType: "single" | "multiple") => void;
  onPenalty: (playerId: string, reason?: string) => void;
}

export function GamePlayPanel({
  players,
  teams,
  currentPlayerIndex,
  currentTeamIndex,
  gameState,
  gameMode,
  currentPlayer,
  currentTeam,
  currentTeamPlayer,
  onScoreSubmit,
  onPenalty,
}: GamePlayPanelProps) {
  console.log(`[GamePlayPanel] Rendering with:`, {
    playersCount: players.length,
    teamsCount: teams?.length,
    gameMode,
    gameState,
    currentPlayerIndex,
    currentTeamIndex,
    currentPlayer: currentPlayer?.name,
    currentTeam: currentTeam?.name,
    currentTeamPlayer: currentTeamPlayer?.name,
    players: players.map(p => ({ name: p.name, eliminated: p.eliminated, isActive: p.isActive }))
  });
  
  if ((gameMode === "individual" && players.length === 0) || 
      (gameMode === "team" && (!teams || teams.length === 0)) || 
      (gameState !== "playing" && gameState !== "finished")) {
    console.log(`[GamePlayPanel] Early return - gameMode: ${gameMode}, players.length: ${players.length}, teams.length: ${teams?.length}, gameState: ${gameState}`);
    return null;
  }



  const getPlayerStatus = (player: Player, index: number): string => {
    if (player.eliminated) return "Eliminated";
    if (gameState === "finished" && player.score === 50) return "Winner!";
    if (gameState === "playing" && index === currentPlayerIndex) return "Current Turn";
    return "";
  };

  const getStatusClasses = (player: Player, index: number): string => {
    if (player.eliminated) return "bg-gray-200 text-gray-400 border-gray-300 opacity-60";
    if (index === currentPlayerIndex) return "bg-blue-200 text-blue-900 border-blue-400 border-2 shadow-lg animate-pulse";
    if (player.score === 50) return "bg-green-100 text-green-800 border-green-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getScoreColor = (score: number): string => {
    if (score === 50) return "text-green-600 font-bold";
    if (score > 40) return "text-orange-600 font-semibold";
    if (score > 30) return "text-yellow-600 font-medium";
    return "text-gray-700";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 mb-2 flex flex-col min-h-[40vh]">
      {/* Current Turn & Score Input - Now at the top */}
      <div className="mb-4">
        <div className="mb-3 text-center">
          {gameMode === "individual" ? (
            <span className="text-lg font-semibold text-blue-700">
              {currentPlayer.name}'s Turn (Score: {currentPlayer.score} / 50)
            </span>
          ) : (
            <div className="text-lg">
              <span className="font-semibold text-blue-700">
                {currentTeam?.name}'s Turn
              </span>
              <span className="ml-2 text-gray-600">
                - {currentTeamPlayer?.name} (Score: {currentTeam?.score} / 50)
              </span>
            </div>
          )}
        </div>
        <ScoreInput
          currentPlayer={gameMode === "individual" ? currentPlayer : (currentTeamPlayer || currentPlayer)}
          onScoreSubmit={onScoreSubmit}
          onPenalty={onPenalty}
        />
      </div>

      {/* Score Board - Now at the bottom, collapsible */}
      <div className="border-t border-gray-200 pt-3">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center justify-between">
            <span>📊 Score Board</span>
            <span className="text-xs text-gray-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 max-h-64 overflow-y-auto">
            {gameMode === "individual" ? (
              // Individual mode - show players
              <div className="space-y-1">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded border ${getStatusClasses(player, index)}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate text-sm">{player.name}</span>
                      {getPlayerStatus(player, index) && (
                        <span className="ml-2 text-xs px-1 py-0.5 rounded-full bg-current bg-opacity-20">
                          {getPlayerStatus(player, index)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-base font-bold ${getScoreColor(player.score)}`}>{player.score}</span>
                      <span className="text-xs text-gray-500">/ 50</span>
                      {player.penalties > 0 && (
                        <span className="text-xs text-red-600">({player.penalties})</span>
                      )}
                      {player.consecutiveMisses !== undefined && player.consecutiveMisses > 0 && (
                        <span className="text-xs text-yellow-600 font-medium">
                          Misses: {player.consecutiveMisses}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Team mode - show teams grouped
              <div className="space-y-3">
                {teams?.map((team, _teamIndex) => (
                  <div key={team.id} className="border rounded-lg p-2">
                    {/* Team Header */}
                    <div className={`flex items-center justify-between mb-2 p-1 rounded ${team.isActive ? 'bg-blue-200 text-blue-900 border-blue-400 border-2 shadow-lg animate-pulse' : 'bg-gray-50'}`}>
                      <span className="font-semibold text-sm text-gray-800">{team.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-base font-bold ${getScoreColor(team.score)}`}>{team.score}</span>
                        <span className="text-xs text-gray-500">/ 50</span>
                        {team.penalties > 0 && (
                          <span className="text-xs text-red-600">({team.penalties})</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Team Players */}
                    <div className="space-y-1 ml-2">
                      {team.players.map((player, playerIndex) => {
                        const isCurrentPlayer = currentTeam?.id === team.id && 
                                              team.currentPlayerIndex === playerIndex;
                        const playerStatus = isCurrentPlayer ? "Current Turn" : "";
                        
                        return (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between p-1 rounded text-xs ${
                              isCurrentPlayer 
                                ? 'bg-blue-200 text-blue-900 border-blue-400 border shadow-md animate-pulse' 
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{player.name}</span>
                              {playerStatus && (
                                <span className="px-1 py-0.5 rounded-full bg-blue-300 text-blue-900 text-xs font-semibold">
                                  {playerStatus}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-600">{player.score}</span>
                              {player.consecutiveMisses !== undefined && player.consecutiveMisses > 0 && (
                                <span className="text-yellow-600 text-xs font-medium">
                                  ({player.consecutiveMisses})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
