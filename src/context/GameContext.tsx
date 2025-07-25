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
} from "../utils/types";
import { sessionStorageUtil } from "../utils/storage/sessionStorage";
import {
  createGame,
  createPenaltyRecord,
  applyPenalty,
  hasPlayerWon,
  getNextPlayerIndex,
  completeGame,
  resetPlayersForNewGame,
} from "../utils/gameStateUtils";
import { GameEngine, ScoringType } from "../utils/gameLogic";

// Action types for the game state reducer
type GameAction =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "ADD_PLAYER"; payload: Player }
  | { type: "UPDATE_PLAYER"; payload: { id: string; updates: Partial<Player> } }
  | { type: "REMOVE_PLAYER"; payload: string }
  | { type: "START_GAME" }
  | { type: "SUBMIT_SCORE"; payload: { playerId: string; score: number; scoringType: "single" | "multiple" } }
  | { type: "APPLY_PENALTY"; payload: { playerId: string; reason?: string } }
  | { type: "NEXT_TURN" }
  | { type: "END_GAME"; payload: Player }
  | { type: "NEW_GAME" }
  | { type: "RESET_STATE" }
  | { type: "OUT_OF_TURN_THROW"; payload: { playerId: string } };

// Initial state
const initialState: AppState = {
  gameState: "setup",
  players: [],
  currentPlayerIndex: 0,
  gameHistory: [],
  currentGame: null,
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

    case "START_GAME":
      if (state.players.length < 2) {
        return state; // Cannot start game with less than 2 players
      }

      const gamePlayersWithActiveFirst = state.players.map((player, index) => ({
        ...player,
        isActive: index === 0,
        score: 0,
        penalties: 0,
      }));

      const newGame = createGame(gamePlayersWithActiveFirst);

      return {
        ...state,
        gameState: "playing",
        players: gamePlayersWithActiveFirst,
        currentPlayerIndex: 0,
        currentGame: newGame,
      };

    case "SUBMIT_SCORE": {
      const { playerId, score, scoringType } = action.payload;
      const playerIndex = state.players.findIndex((p) => p.id === playerId);

      if (playerIndex === -1 || state.gameState !== "playing") {
        return state;
      }

      const player = state.players[playerIndex];
      let updatedPlayer = { ...player };
      let newPenaltyRecord: PenaltyRecord | null = null;
      // Handle consecutive misses and elimination first
      if (score === 0) {
        updatedPlayer.consecutiveMisses = (player.consecutiveMisses || 0) + 1;
        if (updatedPlayer.consecutiveMisses >= 3) {
          updatedPlayer.eliminated = true;
          newPenaltyRecord = {
            playerId: updatedPlayer.id,
            playerName: updatedPlayer.name,
            timestamp: new Date(),
            reason: 'elimination (3 misses)',
          };
        }
      } else {
        updatedPlayer.consecutiveMisses = 0;
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
        const completedGame = state.currentGame
          ? completeGame(state.currentGame, updatedPlayer)
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
      // If no non-eliminated players, end game
      const nonEliminated = updatedPlayers.filter((p) => !p.eliminated);
      if (nonEliminated.length <= 1) {
        return {
          ...state,
          gameState: "finished",
          players: updatedPlayers.map((p) => ({ ...p, isActive: false })),
          currentGame: state.currentGame,
        };
      }
      const playersWithUpdatedActive = updatedPlayers.map((p, index) => ({
        ...p,
        isActive: index === nextPlayerIndex && !p.eliminated,
      }));

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
      const resetPlayers = resetPlayersForNewGame(state.players);
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
