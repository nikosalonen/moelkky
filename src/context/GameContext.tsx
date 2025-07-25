/**
 * Game Context Provider for global game state management
 * Provides centralized state management for the Mölkky Score Counter application
 *
 * @format
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from "preact/compat";
import type { ReactNode } from "preact/compat";
import type {
  AppState,
  Player,
  PenaltyRecord,
  Team,
  GameMode,
} from "../utils/types";
import { sessionStorageUtil } from "../utils/storage/sessionStorage";
import {
  createGame,
  createPenaltyRecord,
  applyPenalty,
  applyTeamScore,
  hasPlayerWon,
  hasTeamWon,
  getNextPlayerIndex,
  completeGame,
  resetPlayersForNewGame,
  reorderPlayersByPreviousScores,
} from "../utils/gameStateUtils";
import { GameEngine, ScoringType } from "../utils/gameLogic";

// Action types for the game state reducer
type GameAction =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "ADD_PLAYER"; payload: Player }
  | { type: "UPDATE_PLAYER"; payload: { id: string; updates: Partial<Player> } }
  | { type: "REMOVE_PLAYER"; payload: string }
  | { type: "ADD_TEAM"; payload: Team }
  | { type: "UPDATE_TEAM"; payload: { teamId: string; updates: Partial<Team> } }
  | { type: "REMOVE_TEAM"; payload: string }
  | { type: "SET_GAME_MODE"; payload: GameMode }
  | { type: "START_GAME" }
  | { type: "SUBMIT_SCORE"; payload: { playerId: string; score: number; scoringType: "single" | "multiple" } }
  | { type: "SUBMIT_TEAM_SCORE"; payload: { teamId: string; score: number; scoringType: "single" | "multiple" } }
  | { type: "APPLY_PENALTY"; payload: { playerId: string; reason?: string } }
  | { type: "APPLY_TEAM_PENALTY"; payload: { teamId: string; reason?: string } }
  | { type: "NEXT_TURN" }
  | { type: "END_GAME"; payload: Player }
  | { type: "NEW_GAME" }
  | { type: "RESET_STATE" }
  | { type: "RESET_TO_SETUP" }
  | { type: "OUT_OF_TURN_THROW"; payload: { playerId: string } };

// Initial state
const initialState: AppState = {
  gameState: "setup",
  players: [],
  teams: [],
  currentPlayerIndex: 0,
  currentTeamIndex: 0,
  gameHistory: [],
  currentGame: null,
  gameMode: "individual",
};

// Game state reducer
export function gameReducer(state: AppState, action: GameAction): AppState {
  switch (action.type) {
    case "LOAD_STATE":
      return action.payload;

    case "ADD_PLAYER":
      return {
        ...state,
        players: [...state.players, action.payload],
      };

    case "UPDATE_PLAYER":
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.payload.id
            ? { ...player, ...action.payload.updates }
            : player
        ),
      };

    case "REMOVE_PLAYER":
      return {
        ...state,
        players: state.players.filter((player) => player.id !== action.payload),
      };

    case "ADD_TEAM":
      return {
        ...state,
        teams: [...(state.teams || []), action.payload],
      };

    case "UPDATE_TEAM":
      return {
        ...state,
        teams: (state.teams || []).map((team) =>
          team.id === action.payload.teamId
            ? { ...team, ...action.payload.updates }
            : team
        ),
      };

    case "REMOVE_TEAM":
      return {
        ...state,
        teams: (state.teams || []).filter((team) => team.id !== action.payload),
      };

    case "SET_GAME_MODE":
      return {
        ...state,
        gameMode: action.payload,
      };

    case "START_GAME":
      if (state.gameMode === "individual") {
        if (state.players.length < 2) {
          return state; // Cannot start game with less than 2 players
        }

        const gamePlayersWithActiveFirst = state.players.map((player, index) => ({
          ...player,
          isActive: index === 0,
          score: 0,
          penalties: 0,
        }));

        const newGame = createGame(gamePlayersWithActiveFirst, "individual");

        return {
          ...state,
          gameState: "playing",
          players: gamePlayersWithActiveFirst,
          currentPlayerIndex: 0,
          currentGame: newGame,
        };
      } else {
        // Team game
        if (!state.teams || state.teams.length < 2) {
          return state; // Cannot start team game with less than 2 teams
        }

        const gameTeamsWithActiveFirst = state.teams.map((team, index) => ({
          ...team,
          isActive: index === 0,
          score: 0,
          penalties: 0,
          consecutiveMisses: 0,
          eliminated: false,
          currentPlayerIndex: 0,
          players: team.players.map(player => ({
            ...player,
            score: 0,
            penalties: 0,
          })),
        }));

        const newGame = createGame([], "team", gameTeamsWithActiveFirst);

        return {
          ...state,
          gameState: "playing",
          teams: gameTeamsWithActiveFirst,
          currentTeamIndex: 0,
          currentGame: newGame,
        };
      }

    case "SUBMIT_SCORE": {
      const { playerId, score, scoringType } = action.payload;
      console.log(`[SUBMIT_SCORE] Player ${playerId} scored ${score} (${scoringType})`);
      
      const playerIndex = state.players.findIndex((p) => p.id === playerId);
      console.log(`[SUBMIT_SCORE] Player index: ${playerIndex}, game state: ${state.gameState}`);

      if (playerIndex === -1 || state.gameState !== "playing") {
        console.log(`[SUBMIT_SCORE] Early return - invalid player index or game state`);
        return state;
      }

      const player = state.players[playerIndex];
      console.log(`[SUBMIT_SCORE] Current player:`, player);
      
      let updatedPlayer = { ...player };
      let newPenaltyRecord: PenaltyRecord | null = null;
      
      // Handle consecutive misses and elimination first
      if (score === 0) {
        const previousMisses = updatedPlayer.consecutiveMisses || 0;
        updatedPlayer.consecutiveMisses = previousMisses + 1;
        console.log(`[SUBMIT_SCORE] Miss recorded. Previous misses: ${previousMisses}, new total: ${updatedPlayer.consecutiveMisses}`);
        
        if (updatedPlayer.consecutiveMisses >= 3) {
          updatedPlayer.eliminated = true;
          console.log(`[SUBMIT_SCORE] PLAYER ELIMINATED: ${updatedPlayer.name} (${updatedPlayer.consecutiveMisses} misses)`);
          newPenaltyRecord = {
            playerId: updatedPlayer.id,
            playerName: updatedPlayer.name,
            timestamp: new Date(),
            reason: 'elimination (3 misses)',
          };
        }
      } else {
        updatedPlayer.consecutiveMisses = 0;
        console.log(`[SUBMIT_SCORE] Score > 0, resetting consecutive misses to 0`);
      }
      
      // Use GameEngine for scoring logic, but preserve elimination state and consecutive misses
      const { updatedPlayer: scoredPlayer } = GameEngine.applyPlayerScore(
        updatedPlayer,
        score,
        scoringType === "single" ? ScoringType.SINGLE_PIN : ScoringType.MULTIPLE_PINS
      );
      // Preserve the eliminated property and consecutive misses from our logic
      if (updatedPlayer.eliminated) {
        scoredPlayer.eliminated = true;
      }
      if (updatedPlayer.consecutiveMisses !== undefined) {
        scoredPlayer.consecutiveMisses = updatedPlayer.consecutiveMisses;
      }
      updatedPlayer = scoredPlayer;
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      // Add penalty record if needed
      let updatedCurrentGame = state.currentGame;
      if (newPenaltyRecord && updatedCurrentGame) {
        updatedCurrentGame = {
          ...updatedCurrentGame,
          penalties: [...updatedCurrentGame.penalties, newPenaltyRecord],
        };
      }

      // Check if player won
      if (hasPlayerWon(updatedPlayer)) {
        console.log(`[SUBMIT_SCORE] PLAYER WON: ${updatedPlayer.name} reached 50 points`);
        const completedGame = state.currentGame
          ? completeGame(state.currentGame, updatedPlayer, null)
          : null;

        return {
          ...state,
          gameState: "finished",
          players: updatedPlayers.map((p) => ({ ...p, isActive: false })),
          currentGame: completedGame,
        };
      }

      // Move to next player, skipping eliminated
      let nextPlayerIndex = state.currentPlayerIndex;
      for (let i = 1; i <= state.players.length; i++) {
        const idx = (state.currentPlayerIndex + i) % state.players.length;
        if (!updatedPlayers[idx].eliminated) {
          nextPlayerIndex = idx;
          break;
        }
      }
      console.log(`[SUBMIT_SCORE] Next player index: ${nextPlayerIndex}`);
      
      // If no non-eliminated players, end game
      const nonEliminated = updatedPlayers.filter((p) => !p.eliminated);
      console.log(`[SUBMIT_SCORE] Non-eliminated players:`, nonEliminated.map(p => ({ name: p.name, eliminated: p.eliminated })));
      console.log(`[SUBMIT_SCORE] Non-eliminated count: ${nonEliminated.length}`);
      
      if (nonEliminated.length <= 1) {
        // If there's exactly one non-eliminated player, they win
        const winner = nonEliminated.length === 1 ? nonEliminated[0] : null;
        console.log(`[SUBMIT_SCORE] GAME ENDING DUE TO ELIMINATION. Winner:`, winner);
        
        const completedGame = state.currentGame && winner
          ? completeGame(updatedCurrentGame || state.currentGame, winner, null)
          : updatedCurrentGame || state.currentGame;

        console.log(`[SUBMIT_SCORE] Completed game:`, completedGame);

        return {
          ...state,
          gameState: "finished",
          players: updatedPlayers.map((p) => ({ ...p, isActive: false })),
          currentGame: completedGame,
        };
      }
      const playersWithUpdatedActive = updatedPlayers.map((p, index) => ({
        ...p,
        isActive: index === nextPlayerIndex && !p.eliminated,
      }));

      console.log(`[SUBMIT_SCORE] Final state - players:`, playersWithUpdatedActive.map(p => ({ 
        name: p.name, 
        isActive: p.isActive, 
        eliminated: p.eliminated,
        consecutiveMisses: p.consecutiveMisses 
      })));
      console.log(`[SUBMIT_SCORE] Final state - currentPlayerIndex: ${nextPlayerIndex}, gameState: playing`);

      return {
        ...state,
        players: playersWithUpdatedActive,
        currentPlayerIndex: nextPlayerIndex,
        currentGame: updatedCurrentGame
          ? {
              ...updatedCurrentGame,
              players: playersWithUpdatedActive,
              totalRounds:
                updatedCurrentGame.totalRounds + (nextPlayerIndex === 0 ? 1 : 0),
            }
          : null,
      };
    }

    case "SUBMIT_TEAM_SCORE": {
      const { teamId, score, scoringType } = action.payload;
      console.log(`[SUBMIT_TEAM_SCORE] Team ${teamId} scored ${score} (${scoringType})`);
      
      if (!state.teams || state.gameState !== "playing") {
        console.log(`[SUBMIT_TEAM_SCORE] Early return - no teams or invalid game state`);
        return state;
      }

      const teamIndex = state.teams.findIndex((t) => t.id === teamId);
      if (teamIndex === -1) {
        console.log(`[SUBMIT_TEAM_SCORE] Team not found`);
        return state;
      }

      const team = state.teams[teamIndex];
      console.log(`[SUBMIT_TEAM_SCORE] Current team:`, team);
      
      let updatedTeam = { ...team };
      let newPenaltyRecord: PenaltyRecord | null = null;
      
      // Get current player ID for updating individual player score
      const currentPlayerId = team.players[team.currentPlayerIndex || 0]?.id;
      
      // Apply team score using the utility function (handles consecutive misses)
      updatedTeam = applyTeamScore(updatedTeam, score, currentPlayerId);
      
      // Check if team was eliminated due to consecutive misses
      if (updatedTeam.eliminated && score === 0) {
        console.log(`[SUBMIT_TEAM_SCORE] TEAM ELIMINATED: ${updatedTeam.name} (${updatedTeam.consecutiveMisses} misses)`);
        newPenaltyRecord = {
          playerId: "", // No specific player for team elimination
          playerName: updatedTeam.name,
          teamId: updatedTeam.id,
          teamName: updatedTeam.name,
          timestamp: new Date(),
          reason: 'team elimination (3 misses)',
        };
      }
      
      const updatedTeams = [...state.teams];
      updatedTeams[teamIndex] = updatedTeam;

      // Add penalty record if needed
      let updatedCurrentGame = state.currentGame;
      if (newPenaltyRecord && updatedCurrentGame) {
        updatedCurrentGame = {
          ...updatedCurrentGame,
          penalties: [...updatedCurrentGame.penalties, newPenaltyRecord],
        };
      }

      // Check if team won
      if (hasTeamWon(updatedTeam)) {
        console.log(`[SUBMIT_TEAM_SCORE] TEAM WON: ${updatedTeam.name} reached 50 points`);
        const completedGame = state.currentGame
          ? completeGame(state.currentGame, null, updatedTeam)
          : null;

        return {
          ...state,
          gameState: "finished",
          teams: updatedTeams.map((t) => ({ ...t, isActive: false })),
          currentGame: completedGame,
        };
      }

      // Move to next team with the same player position, or to next player position if all teams have thrown
      const currentTeamIndex = state.currentTeamIndex || 0;
      const currentTeam = updatedTeams[currentTeamIndex];
      const currentPlayerIndex = currentTeam.currentPlayerIndex || 0;
      
      let nextTeamIndex = currentTeamIndex;
      let nextPlayerIndex = currentPlayerIndex;
      let updatedTeamsWithRotation = [...updatedTeams];
      
      // Try to move to next team with the same player position
      let foundNextTeam = false;
      for (let i = 1; i <= state.teams.length; i++) {
        const idx = (currentTeamIndex + i) % state.teams.length;
        if (!updatedTeams[idx].eliminated) {
          nextTeamIndex = idx;
          nextPlayerIndex = currentPlayerIndex; // Keep same player position
          foundNextTeam = true;
          console.log(`[SUBMIT_TEAM_SCORE] Moving to next team: ${nextTeamIndex} with player position: ${nextPlayerIndex}`);
          break;
        }
      }
      
      // If no next team found, move to next player position in first non-eliminated team
      if (!foundNextTeam) {
        for (let i = 0; i < state.teams.length; i++) {
          if (!updatedTeams[i].eliminated) {
            nextTeamIndex = i;
            nextPlayerIndex = (currentPlayerIndex + 1) % updatedTeams[i].players.length;
            console.log(`[SUBMIT_TEAM_SCORE] Moving to next player position: ${nextPlayerIndex} in team: ${nextTeamIndex}`);
            break;
          }
        }
      }
      
      // Update all teams to the correct player position
      updatedTeamsWithRotation = updatedTeamsWithRotation.map((team, index) => {
        if (index === nextTeamIndex) {
          return {
            ...team,
            currentPlayerIndex: nextPlayerIndex,
          };
        } else {
          // Keep other teams at the same player position for consistency
          return {
            ...team,
            currentPlayerIndex: currentPlayerIndex,
          };
        }
      });
      
      // If no non-eliminated teams, end game
      const nonEliminated = updatedTeamsWithRotation.filter((t) => !t.eliminated);
      console.log(`[SUBMIT_TEAM_SCORE] Non-eliminated teams:`, nonEliminated.map(t => ({ name: t.name, eliminated: t.eliminated })));
      console.log(`[SUBMIT_TEAM_SCORE] Non-eliminated count: ${nonEliminated.length}`);
      
      if (nonEliminated.length <= 1) {
        // If there's exactly one non-eliminated team, they win
        const winner = nonEliminated.length === 1 ? nonEliminated[0] : null;
        console.log(`[SUBMIT_TEAM_SCORE] GAME ENDING DUE TO ELIMINATION. Winner:`, winner);
        
        const completedGame = state.currentGame && winner
          ? completeGame(updatedCurrentGame || state.currentGame, null, winner)
          : updatedCurrentGame || state.currentGame;

        return {
          ...state,
          gameState: "finished",
          teams: updatedTeamsWithRotation.map((t) => ({ ...t, isActive: false })),
          currentGame: completedGame,
        };
      }

      const teamsWithUpdatedActive = updatedTeamsWithRotation.map((t, index) => ({
        ...t,
        isActive: index === nextTeamIndex && !t.eliminated,
      }));

      console.log(`[SUBMIT_TEAM_SCORE] Final state - teams:`, teamsWithUpdatedActive.map(t => ({ 
        name: t.name, 
        isActive: t.isActive, 
        eliminated: t.eliminated,
        consecutiveMisses: t.consecutiveMisses,
        currentPlayerIndex: t.currentPlayerIndex
      })));

      return {
        ...state,
        teams: teamsWithUpdatedActive,
        currentTeamIndex: nextTeamIndex,
        currentGame: updatedCurrentGame
          ? {
              ...updatedCurrentGame,
              teams: teamsWithUpdatedActive,
              totalRounds:
                updatedCurrentGame.totalRounds + (nextTeamIndex === 0 ? 1 : 0),
            }
          : null,
      };
    }

    case "APPLY_PENALTY": {
      const { playerId, reason = "Rule violation" } = action.payload;
      const playerIndex = state.players.findIndex((p) => p.id === playerId);

      if (playerIndex === -1 || state.gameState !== "playing") {
        return state;
      }

      const player = state.players[playerIndex];
      const updatedPlayer = applyPenalty(player);
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      const penaltyRecord = createPenaltyRecord(playerId, player.name, reason);

      // Move to next player after penalty
      const nextPlayerIndex = getNextPlayerIndex(
        state.currentPlayerIndex,
        state.players.length
      );
      const playersWithUpdatedActive = updatedPlayers.map((p, index) => ({
        ...p,
        isActive: index === nextPlayerIndex,
      }));

      return {
        ...state,
        players: playersWithUpdatedActive,
        currentPlayerIndex: nextPlayerIndex,
        currentGame: state.currentGame
          ? {
              ...state.currentGame,
              players: playersWithUpdatedActive,
              penalties: [...state.currentGame.penalties, penaltyRecord],
              totalRounds:
                state.currentGame.totalRounds + (nextPlayerIndex === 0 ? 1 : 0),
            }
          : null,
      };
    }

    case "NEXT_TURN": {
      if (state.gameState !== "playing") {
        return state;
      }

      const nextPlayerIndex = getNextPlayerIndex(
        state.currentPlayerIndex,
        state.players.length
      );
      const updatedPlayers = state.players.map((p, index) => ({
        ...p,
        isActive: index === nextPlayerIndex,
      }));

      return {
        ...state,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        currentGame: state.currentGame
          ? {
              ...state.currentGame,
              players: updatedPlayers,
              totalRounds:
                state.currentGame.totalRounds + (nextPlayerIndex === 0 ? 1 : 0),
            }
          : null,
      };
    }

    case "END_GAME": {
      const winner = action.payload;
      const completedGame = state.currentGame
        ? completeGame(state.currentGame, winner)
        : null;

      return {
        ...state,
        gameState: "finished",
        players: state.players.map((p) => ({ ...p, isActive: false })),
        currentGame: completedGame,
      };
    }

    case "NEW_GAME": {
      console.log(`[NEW_GAME] Starting new game. Players before reordering:`, state.players.map(p => ({ 
        name: p.name, 
        score: p.score,
        eliminated: p.eliminated, 
        consecutiveMisses: p.consecutiveMisses 
      })));
      
      // First reorder players based on previous scores (inverted order)
      const reorderedPlayers = reorderPlayersByPreviousScores(state.players);
      console.log(`[NEW_GAME] Players after reordering:`, reorderedPlayers.map(p => ({ 
        name: p.name, 
        score: p.score
      })));
      
      // Then reset all player stats for the new game
      const resetPlayers = resetPlayersForNewGame(reorderedPlayers);
      console.log(`[NEW_GAME] Players after reset:`, resetPlayers.map(p => ({ 
        name: p.name, 
        score: p.score,
        penalties: p.penalties
      })));
      
      const gameHistory = state.currentGame
        ? [...state.gameHistory, state.currentGame]
        : state.gameHistory;

      return {
        ...state,
        gameState: "setup",
        players: resetPlayers,
        currentPlayerIndex: 0,
        gameHistory,
        currentGame: null,
      };
    }

    case "RESET_STATE":
      return initialState;

    case "RESET_TO_SETUP": {
      // Preserve players and teams but reset their game state
      const resetPlayers = state.players.map(player => ({
        ...player,
        score: 0,
        penalties: 0,
        isActive: false,
        consecutiveMisses: 0,
        eliminated: false,
      }));

      const resetTeams = state.teams?.map(team => ({
        ...team,
        score: 0,
        penalties: 0,
        isActive: false,
        consecutiveMisses: 0,
        eliminated: false,
        currentPlayerIndex: 0,
        players: team.players.map(player => ({
          ...player,
          score: 0,
          penalties: 0,
        })),
      }));

      return {
        ...state,
        gameState: "setup",
        players: resetPlayers,
        teams: resetTeams,
        currentPlayerIndex: 0,
        currentTeamIndex: 0,
        currentGame: null,
      };
    }

    case "OUT_OF_TURN_THROW": {
      const { playerId } = action.payload;
      const playerIndex = state.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return state;
      const player = state.players[playerIndex];
      let updatedPlayer = { ...player };
      let newPenaltyRecord: PenaltyRecord | null = null;
      // If score is 37 or more, reset to 25
      if (updatedPlayer.score >= 37) {
        updatedPlayer.score = 25;
        newPenaltyRecord = {
          playerId: updatedPlayer.id,
          playerName: updatedPlayer.name,
          timestamp: new Date(),
          reason: 'out-of-turn',
        };
      }
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = updatedPlayer;
      let updatedCurrentGame = state.currentGame;
      if (newPenaltyRecord && updatedCurrentGame) {
        updatedCurrentGame = {
          ...updatedCurrentGame,
          penalties: [...updatedCurrentGame.penalties, newPenaltyRecord],
        };
      }
      return {
        ...state,
        players: updatedPlayers,
        currentGame: updatedCurrentGame,
      };
    }

    default:
      return state;
  }
}

// Context type
interface GameContextType {
  state: AppState;
  dispatch: (action: GameAction) => void;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Context provider props
interface GameProviderProps {
  children: ReactNode;
}

// Context provider component
export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load state from session storage on mount
  useEffect(() => {
    const savedState = sessionStorageUtil.loadAppState();
    if (savedState) {
      dispatch({ type: "LOAD_STATE", payload: savedState });
    }
  }, []);

  // Save state to session storage whenever state changes
  useEffect(() => {
    try {
      sessionStorageUtil.saveAppState(state);

      // Also save current game separately if it exists
      if (state.currentGame) {
        sessionStorageUtil.saveCurrentGame(state.currentGame);
      }

      // Save game history
      sessionStorageUtil.saveGameHistory(state.gameHistory);
    } catch (error) {
      console.warn("Failed to save state to session storage:", error);
    }
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook to use game context
export function useGameContext(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
