/**
 * Main App component that orchestrates the Mölkky Score Counter game flow
 * Manages game state transitions and coordinates all game components
 *
 * @format
 */

import { useState } from "preact/hooks";
import { GameProvider, useGameFlow, usePlayerManagement } from "./hooks";
import { useGameContext } from "./context/GameContext";
import { PlayerManager } from "./components/PlayerManager/PlayerManager";
import { GamePlayPanel } from "./components/GameBoard/GameBoard";
import { GameModeSelector } from "./components/GameModeSelector";
import { TeamManager } from "./components/TeamManager";

import { WinnerDisplay } from "./components/WinnerDisplay";
import { GameHistory } from "./components/GameHistory";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider, useToast } from "./components/Toast";
import "./app.css";

/**
 * Main game component that handles game flow control
 */
function GameApp() {
  const gameFlow = useGameFlow();
  const playerManagement = usePlayerManagement();
  const { addToast } = useToast();

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

  const { state } = useGameContext();
  const { gameMode, teams, players } = state;

  // State for game history modal
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  /**
   * Handle starting a new game
   */
  const handleStartGame = () => {
    const result = startGame();
    if (result.success) {
      addToast({
        type: "success",
        title: "Game Started!",
        message: `Game started with ${playerManagement.players.length} players. Good luck!`,
        duration: 4000,
        priority: 'high',
      });
    } else if (result.error) {
      addToast({
        type: "error",
        title: "Failed to Start Game",
        message: result.error,
      });
    }
  };

  /**
   * Handle score submission with automatic turn advancement
   */
  const handleScoreSubmit = (score: number, scoringType: "single" | "multiple") => {
    console.log(`[App] handleScoreSubmit called with score: ${score}, type: ${scoringType}`);
    console.log(`[App] Current game state:`, gameState);
    console.log(`[App] Current player:`, currentPlayer);
    
    const result = submitScore(score, scoringType);
    console.log(`[App] submitScore result:`, result);
    
    if (result.success) {
      addToast({
        type: "success",
        title: "Score Submitted",
        message: `Score of ${score} points recorded for ${currentPlayer?.name}.`,
        duration: 2000,
        priority: 'low',
      });
    } else if (result.error) {
      addToast({
        type: "error",
        title: "Failed to Submit Score",
        message: result.error,
      });
    }
    
    console.log(`[App] After submitScore - game state:`, gameState);
    console.log(`[App] After submitScore - current player:`, currentPlayer);
    console.log(`[App] After submitScore - winner:`, winner);
    
    // Turn advancement is handled automatically in the game logic
  };

  /**
   * Handle penalty application with automatic turn advancement
   */
  const handlePenaltyApply = (reason?: string) => {
    const result = applyPenalty(reason);
    if (result.success) {
      addToast({
        type: "warning",
        title: "Penalty Applied",
        message: `Penalty applied to ${currentPlayer?.name}. Score reset to 25.`,
        duration: 3000,
        priority: 'normal',
      });
    } else if (result.error) {
      addToast({
        type: "error",
        title: "Failed to Apply Penalty",
        message: result.error,
      });
    }
    // Turn advancement is handled automatically in the game logic
  };

  /**
   * Handle starting a new game after completion
   */
  const handleNewGame = () => {
    const result = newGame();
    if (result.success) {
      addToast({
        type: "info",
        title: "New Game Started",
        message: "A new game has been started with the same players.",
        duration: 4000,
        priority: 'high',
      });
    } else if (result.error) {
      addToast({
        type: "error",
        title: "Failed to Start New Game",
        message: result.error,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
            Mölkky Score Counter
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Track scores and manage your Mölkky games
          </p>
        </header>

        {/* Game History Button */}
        <div className="text-center mb-4 sm:mb-6">
          <button
            onClick={() => setIsHistoryVisible(true)}
            className="px-4 sm:px-6 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation"
          >
            📊 View Game History
          </button>
        </div>

        {/* Game History Modal */}
        <GameHistory
          isVisible={isHistoryVisible}
          onClose={() => setIsHistoryVisible(false)}
        />

        {/* Game State: Setup */}
        {gameState === "setup" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Game Mode Selector */}
            <GameModeSelector gameActive={false} />

            {/* Player Management */}
            <PlayerManager players={playerManagement.players} gameActive={false} />

            {/* Team Management (only show for team mode) */}
            {gameMode === "team" && (
              <TeamManager 
                teams={teams || []} 
                players={playerManagement.players} 
                gameActive={false} 
              />
            )}

            {/* Start Game Button */}
            <div className="text-center">
              <button
                onClick={handleStartGame}
                disabled={!canStartGame}
                className={`px-6 sm:px-8 py-4 sm:py-3 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 touch-manipulation ${
                  canStartGame
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canStartGame
                  ? `Start ${gameMode === "team" ? "Team " : ""}Game`
                  : gameMode === "team"
                  ? `Need ${Math.max(0, 2 - (teams?.length || 0))} more team${(teams?.length || 0) === 1 ? "" : "s"}`
                  : `Need ${Math.max(0, 2 - playerManagement.players.length)} more player${
                      playerManagement.players.length === 1 ? "" : "s"
                    }`}
              </button>
            </div>
          </div>
        )}

        {/* Game State: Playing */}
        {gameState === "playing" && (gameMode === "individual" ? currentPlayer : gameFlow.currentTeamPlayer) && (
          <GamePlayPanel
            players={players}
            teams={teams}
            currentPlayerIndex={gameFlow.currentPlayerIndex}
            currentTeamIndex={gameFlow.currentTeamIndex}
            gameState={gameState}
            gameMode={gameMode}
            currentPlayer={gameMode === "individual" ? currentPlayer! : gameFlow.currentTeamPlayer!}
            currentTeam={gameFlow.currentTeam}
            currentTeamPlayer={gameFlow.currentTeamPlayer}
            onScoreSubmit={(_playerId: string, score: number, scoringType: "single" | "multiple") => handleScoreSubmit(score, scoringType)}
            onPenalty={(_playerId: string, reason?: string) => handlePenaltyApply(reason)}
          />
        )}
        
        {/* Debug: Show when no game panel is rendered */}
        {gameState === "playing" && !currentPlayer && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Debug:</strong> Game state is "playing" but no current player found.
            <br />
            Players: {JSON.stringify(players.map(p => ({ name: p.name, isActive: p.isActive, eliminated: p.eliminated })))}
            <br />
            Current Player Index: {gameFlow.currentPlayerIndex}
          </div>
        )}

        {/* Game State: Finished */}
        {gameState === "finished" && winner && (
          <div className="space-y-4 sm:space-y-6">
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
    <ErrorBoundary>
      <ToastProvider>
        <GameProvider>
          <GameApp />
        </GameProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
