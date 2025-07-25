/**
 * GameBoard Component
 * Displays current game state, scores, and turn indicators
 *
 * @format
 */

import type { Player, GameState } from "../../utils/types";
import { ScoreInput } from "../ScoreInput/ScoreInput";

interface GamePlayPanelProps {
  players: Player[];
  currentPlayerIndex: number;
  gameState: GameState;
  currentPlayer: Player;
  onScoreSubmit: (playerId: string, score: number, scoringType: "single" | "multiple") => void;
  onPenalty: (playerId: string, reason?: string) => void;
}

export function GamePlayPanel({
  players,
  currentPlayerIndex,
  gameState,
  currentPlayer,
  onScoreSubmit,
  onPenalty,
}: GamePlayPanelProps) {
  console.log(`[GamePlayPanel] Rendering with:`, {
    playersCount: players.length,
    gameState,
    currentPlayerIndex,
    currentPlayer: currentPlayer?.name,
    players: players.map(p => ({ name: p.name, eliminated: p.eliminated, isActive: p.isActive }))
  });
  
  if (players.length === 0 || (gameState !== "playing" && gameState !== "finished")) {
    console.log(`[GamePlayPanel] Early return - players.length: ${players.length}, gameState: ${gameState}`);
    return null;
  }

  const getPointsNeeded = (score: number): number => Math.max(0, 50 - score);

  const getPlayerStatus = (player: Player, index: number): string => {
    if (player.eliminated) return "Eliminated";
    if (gameState === "finished" && player.score === 50) return "Winner!";
    if (gameState === "playing" && index === currentPlayerIndex) return "Current Turn";
    return "";
  };

  const getStatusClasses = (player: Player, index: number): string => {
    if (player.eliminated) return "bg-gray-200 text-gray-400 border-gray-300 opacity-60";
    if (index === currentPlayerIndex) return "bg-blue-100 text-blue-800 border-blue-200";
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
    <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 mb-2 flex flex-col min-h-[80vh]">
      {/* Player List */}
      <div className="flex-1 overflow-y-auto mb-2">
        <div className="space-y-2">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg border-2 ${getStatusClasses(player, index)}`}
            >
              <div className="flex-1 min-w-0">
                <span className="font-semibold truncate text-base">{player.name}</span>
                {getPlayerStatus(player, index) && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-current bg-opacity-20">
                    {getPlayerStatus(player, index)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-lg font-bold ${getScoreColor(player.score)}`}>{player.score}</span>
                <span className="text-xs text-gray-500">/ 50</span>
                <span className="text-xs text-gray-600">Need: {getPointsNeeded(player.score)}</span>
                {player.penalties > 0 && (
                  <span className="text-xs text-red-600 font-medium">Penalties: {player.penalties}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Player & Pin Selector */}
      <div className="sticky bottom-0 bg-white pt-2 pb-1 z-10 border-t border-gray-200">
        <div className="mb-2 text-center">
          <span className="text-base font-semibold text-blue-700">
            {currentPlayer.name}'s Turn
          </span>
          <span className="ml-2 text-xs text-gray-600">
            (Score: {currentPlayer.score} / 50)
          </span>
        </div>
        <ScoreInput
          currentPlayer={currentPlayer}
          onScoreSubmit={onScoreSubmit}
          onPenalty={onPenalty}
        />
      </div>
    </div>
  );
}
