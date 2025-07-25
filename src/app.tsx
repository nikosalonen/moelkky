/**
 * Main App component that orchestrates the Mölkky Score Counter game flow
 * Manages game state transitions and coordinates all game components
 *
 * @format
 */

import { GameProvider, useGameFlow, usePlayerManagement } from "./hooks";
import { PlayerManager } from "./components/PlayerManager/PlayerManager";
import { GameBoard } from "./components/GameBoard/GameBoard";
import { ScoreInput } from "./components/ScoreInput/ScoreInput";
import { WinnerDisplay } from "./components/WinnerDisplay";
import "./app.css";

/**
 * Main game component that handles game flow control
 */
function GameApp() {
  const gameFlow = useGameFlow();
  const playerManagement = usePlayerManagement();

  const {
    gameState,
    currentPlayer,
    canStartGame,
    winner,
    startGame,
    submitScore,
    applyPenalty,
    newGame,
  } = gameFlow;

  const { players } = playerManagement;

  /**
   * Handle starting a new game
   */
  const handleStartGame = () => {
    const result = startGame();
    if (!result.success && result.error) {
      // Error handling could be enhanced with toast notifications
      console.error("Failed to start game:", result.error);
    }
  };

  /**
   * Handle score submission with automatic turn advancement
   */
  const handleScoreSubmit = (score: number) => {
    const result = submitScore(score);
    if (!result.success && result.error) {
      console.error("Failed to submit score:", result.error);
    }
    // Turn advancement is handled automatically in the game logic
  };

  /**
   * Handle penalty application with automatic turn advancement
   */
  const handlePenaltyApply = (reason?: string) => {
    const result = applyPenalty(reason);
    if (!result.success && result.error) {
      console.error("Failed to apply penalty:", result.error);
    }
    // Turn advancement is handled automatically in the game logic
  };

  /**
   * Handle starting a new game after completion
   */
  const handleNewGame = () => {
    const result = newGame();
    if (!result.success && result.error) {
      console.error("Failed to start new game:", result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Mölkky Score Counter
          </h1>
          <p className="text-gray-600">
            Track scores and manage your Mölkky games
          </p>
        </header>

        {/* Game History Button - TODO: Implement in task 11 */}

        {/* Game State: Setup */}
        {gameState === "setup" && (
          <div className="space-y-6">
            {/* Player Management */}
            <PlayerManager players={players} gameActive={false} />

            {/* Start Game Button */}
            <div className="text-center">
              <button
                onClick={handleStartGame}
                disabled={!canStartGame}
                className={`px-8 py-3 text-lg font-semibold rounded-lg transition-colors ${
                  canStartGame
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canStartGame
                  ? "Start Game"
                  : `Need ${Math.max(0, 2 - players.length)} more player${
                      players.length === 1 ? "" : "s"
                    }`}
              </button>
            </div>
          </div>
        )}

        {/* Game State: Playing */}
        {gameState === "playing" && (
          <div className="space-y-6">
            {/* Game Board */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <GameBoard 
                players={players}
                currentPlayerIndex={gameFlow.currentPlayerIndex}
                gameState={gameState}
              />
            </div>

            {/* Score Input */}
            {currentPlayer && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  {currentPlayer.name}'s Turn
                </h2>
                <ScoreInput
                  currentPlayer={currentPlayer}
                  onScoreSubmit={(_playerId: string, score: number) => handleScoreSubmit(score)}
                  onPenalty={(_playerId: string, reason?: string) => handlePenaltyApply(reason)}
                />
              </div>
            )}

            {/* Player modification prevention notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Game in progress:</strong> Player modifications are
                disabled during active gameplay.
              </p>
            </div>
          </div>
        )}

        {/* Game State: Finished */}
        {gameState === "finished" && winner && (
          <div className="space-y-6">
            {/* Winner Display */}
            <WinnerDisplay
              winner={winner}
              players={players}
              onNewGame={handleNewGame}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Root App component with context provider
 */
export function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}
