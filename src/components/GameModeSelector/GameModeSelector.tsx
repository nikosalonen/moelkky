/**
 * GameModeSelector Component
 * Allows users to select between individual and team game modes
 *
 * @format
 */

import { useGameContext } from "../../context/GameContext";
import type { GameMode } from "../../utils/types";

interface GameModeSelectorProps {
  gameActive: boolean;
}

export function GameModeSelector({ gameActive }: GameModeSelectorProps) {
  const { state, dispatch } = useGameContext();
  const { gameMode } = state;

  const handleModeChange = (newMode: GameMode) => {
    if (gameActive) return; // Cannot change mode during active game
    
    dispatch({ type: "SET_GAME_MODE", payload: newMode });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Game Mode
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Individual Mode */}
        <button
          onClick={() => handleModeChange("individual")}
          disabled={gameActive}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            gameMode === "individual"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
          } ${gameActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">👤</div>
            <h3 className="font-semibold text-lg mb-1">Individual</h3>
            <p className="text-sm">
              Each player competes individually. First to reach 50 points wins.
            </p>
          </div>
        </button>

        {/* Team Mode */}
        <button
          onClick={() => handleModeChange("team")}
          disabled={gameActive}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            gameMode === "team"
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
          } ${gameActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-lg mb-1">Team</h3>
            <p className="text-sm">
              Players compete in teams. First team to reach 50 points wins.
            </p>
          </div>
        </button>
      </div>

      {gameActive && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-700">
            ⚠️ Game mode cannot be changed during an active game.
          </p>
        </div>
      )}
    </div>
  );
} 
