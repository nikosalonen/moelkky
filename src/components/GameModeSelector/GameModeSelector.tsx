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
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 mobile-card">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 mobile-text-lg">
        Game Mode
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Individual Mode */}
        <button
          onClick={() => handleModeChange("individual")}
          disabled={gameActive}
          className={`mobile-btn p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
            gameMode === "individual"
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
          } ${gameActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="text-center">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2">👤</div>
            <h3 className="font-semibold text-base sm:text-lg mb-1 mobile-text-base">Individual</h3>
            <p className="text-xs sm:text-sm mobile-text-sm">
              Each player competes individually. First to reach 50 points wins.
            </p>
          </div>
        </button>

        {/* Team Mode */}
        <button
          onClick={() => handleModeChange("team")}
          disabled={gameActive}
          className={`mobile-btn p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
            gameMode === "team"
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
          } ${gameActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="text-center">
            <div className="text-xl sm:text-2xl mb-1 sm:mb-2">👥</div>
            <h3 className="font-semibold text-base sm:text-lg mb-1 mobile-text-base">Team</h3>
            <p className="text-xs sm:text-sm mobile-text-sm">
              Players compete in teams. First team to reach 50 points wins.
            </p>
          </div>
        </button>
      </div>

      {gameActive && (
        <div className="mt-3 sm:mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded mobile-card">
          <p className="text-xs sm:text-sm text-yellow-700 mobile-text-sm">
            ⚠️ Game mode cannot be changed during an active game.
          </p>
        </div>
      )}
    </div>
  );
} 
