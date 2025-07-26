/**
 * Test utilities and helpers for the Mölkky Score Counter application
 *
 * @format
 */

import { render, RenderOptions } from "@testing-library/preact";
import { h, ComponentChildren } from "preact";
import { GameProvider } from "../src/context/GameContext";
import { createPlayer, createGame } from "../src/utils/gameStateUtils";
import type { Player, Game, AppState } from "../src/utils/types";

// Mock data factories
export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: `player-${Math.random().toString(36).substr(2, 9)}`,
  name: "Test Player",
  score: 0,
  penalties: 0,
  isActive: false,
  consecutiveMisses: 0,
  eliminated: false,
  ...overrides,
});

export const createMockGame = (overrides: Partial<Game> = {}): Game => ({
  id: `game-${Math.random().toString(36).substr(2, 9)}`,
  players: [createMockPlayer(), createMockPlayer({ name: "Player 2" })],
  winner: null,
  startTime: new Date(),
  endTime: null,
  totalRounds: 0,
  penalties: [],
  ...overrides,
});

export const createMockAppState = (
  overrides: Partial<AppState> = {}
): AppState => ({
  gameState: "setup",
  players: [],
  teams: [],
  currentPlayerIndex: 0,
  currentTeamIndex: 0,
  gameHistory: [],
  currentGame: null,
  gameMode: "individual",
  ...overrides,
});

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialState?: Partial<AppState>;
}

export function renderWithProviders(
  ui: ComponentChildren,
  options: CustomRenderOptions = {}
) {
  const { initialState, ...renderOptions } = options;

  function Wrapper({ children }: { children: ComponentChildren }) {
    return h(GameProvider, { initialState }, children);
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Test data generators
export const generatePlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockPlayer({
      name: `Player ${i + 1}`,
      id: `player-${i + 1}`,
    })
  );
};

export const generateGameWithScores = (playerScores: number[]): Game => {
  const players = playerScores.map((score, i) =>
    createMockPlayer({
      name: `Player ${i + 1}`,
      id: `player-${i + 1}`,
      score,
    })
  );

  return createMockGame({
    players,
    winner: players.find((p) => p.score === 50) || null,
  });
};

// Common test scenarios
export const testScenarios = {
  // Game setup scenarios
  emptyGame: (): AppState => createMockAppState(),

  gameWithPlayers: (playerCount: number = 2): AppState =>
    createMockAppState({
      players: generatePlayers(playerCount),
    }),

  activeGame: (playerCount: number = 2): AppState => {
    const players = generatePlayers(playerCount);
    players[0].isActive = true;

    return createMockAppState({
      gameState: "playing",
      players,
      currentGame: createMockGame({ players }),
    });
  },

  finishedGame: (): AppState => {
    const players = generatePlayers(2);
    players[0].score = 50;

    return createMockAppState({
      gameState: "finished",
      players,
      currentGame: createMockGame({
        players,
        winner: players[0],
        endTime: new Date(),
      }),
    });
  },

  // Scoring scenarios
  playerNearWin: (score: number = 45): Player =>
    createMockPlayer({
      name: "Near Winner",
      score,
    }),

  playerOvershot: (): Player =>
    createMockPlayer({
      name: "Overshot Player",
      score: 25, // Reset after going over 50
      penalties: 1,
    }),

  eliminatedPlayer: (): Player =>
    createMockPlayer({
      name: "Eliminated Player",
      consecutiveMisses: 3,
      eliminated: true,
      isActive: false,
    }),
};

// Mock implementations for common dependencies
export const mockSessionStorage = {
  loadAppState: vi.fn(() => null),
  saveAppState: vi.fn(),
  saveCurrentGame: vi.fn(),
  saveGameHistory: vi.fn(),
  clearAll: vi.fn(),
};

export const mockGameContext = {
  state: createMockAppState(),
  dispatch: vi.fn(),
};

// Test assertion helpers
export const expectPlayerScore = (player: Player, expectedScore: number) => {
  expect(player.score).toBe(expectedScore);
};

export const expectGameState = (
  state: AppState,
  expectedGameState: AppState["gameState"]
) => {
  expect(state.gameState).toBe(expectedGameState);
};

export const expectPlayerActive = (
  player: Player,
  isActive: boolean = true
) => {
  expect(player.isActive).toBe(isActive);
};

export const expectGameWinner = (game: Game, expectedWinner: Player | null) => {
  expect(game.winner).toEqual(expectedWinner);
};

// Async test helpers
export const waitForGameStateChange = async (
  getState: () => AppState,
  expectedState: AppState["gameState"],
  timeout: number = 1000
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (getState().gameState === expectedState) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(
    `Game state did not change to ${expectedState} within ${timeout}ms`
  );
};

// Performance testing helpers
export const measureTestPerformance = <T>(
  testFn: () => T,
  testName: string
): T => {
  const startTime = performance.now();
  const result = testFn();
  const endTime = performance.now();

  console.log(`${testName} took ${endTime - startTime} milliseconds`);
  return result;
};

// Accessibility testing helpers
export const expectAccessibleButton = (button: HTMLElement) => {
  expect(button).toHaveAttribute("type", "button");
  expect(button).not.toHaveAttribute("aria-disabled", "true");
};

export const expectAccessibleInput = (
  input: HTMLElement,
  labelText: string
) => {
  expect(input).toHaveAccessibleName(labelText);
  expect(input).not.toHaveAttribute("aria-invalid", "true");
};

// Error testing helpers
export const expectErrorToBeThrown = (
  fn: () => void,
  expectedError: string
) => {
  expect(fn).toThrow(expectedError);
};

export const expectNoErrors = (fn: () => void) => {
  expect(fn).not.toThrow();
};

// Component testing helpers
export const getByTestId = (
  container: HTMLElement,
  testId: string
): HTMLElement => {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Element with data-testid="${testId}" not found`);
  }
  return element as HTMLElement;
};

export const queryByTestId = (
  container: HTMLElement,
  testId: string
): HTMLElement | null => {
  return container.querySelector(
    `[data-testid="${testId}"]`
  ) as HTMLElement | null;
};

// Form testing helpers
export const fillForm = (
  form: HTMLFormElement,
  data: Record<string, string>
) => {
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
};

export const submitForm = (form: HTMLFormElement) => {
  form.dispatchEvent(new Event("submit", { bubbles: true }));
};

// Game flow testing helpers
export const simulateGameFlow = {
  addPlayer: (name: string) => ({
    type: "ADD_PLAYER" as const,
    payload: createMockPlayer({ name }),
  }),

  startGame: () => ({
    type: "START_GAME" as const,
  }),

  submitScore: (
    playerId: string,
    score: number,
    scoringType: "single" | "multiple" = "single"
  ) => ({
    type: "SUBMIT_SCORE" as const,
    payload: { playerId, score, scoringType },
  }),

  applyPenalty: (playerId: string, reason: string = "Rule violation") => ({
    type: "APPLY_PENALTY" as const,
    payload: { playerId, reason },
  }),

  resetGame: () => ({
    type: "RESET_TO_SETUP" as const,
  }),
};

// Export commonly used testing library functions for convenience
export {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/preact";

export { vi, expect, describe, it, beforeEach, afterEach } from "vitest";
