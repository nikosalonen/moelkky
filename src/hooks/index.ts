/**
 * Barrel export for all custom hooks
 * Provides centralized access to all game-related hooks
 *
 * @format
 */

export { usePlayerManagement } from "./usePlayerManagement";
export type { UsePlayerManagementReturn } from "./usePlayerManagement";

export { useGameFlow } from "./useGameFlow";
export type { UseGameFlowReturn } from "./useGameFlow";

export { useGameHistory } from "./useGameHistory";
export type { UseGameHistoryReturn, GameHistoryStats } from "./useGameHistory";

// Re-export context hook for convenience
export { useGameContext, GameProvider } from "../context/GameContext";
