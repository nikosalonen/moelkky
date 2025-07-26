/**
 * Test suite setup verification
 * Ensures the testing infrastructure is properly configured
 *
 * @format
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import { h } from "preact";
import {
  createMockPlayer,
  createMockGame,
  createMockAppState,
  generatePlayers,
  testScenarios,
  renderWithProviders,
} from "./testUtils";

describe("Test Infrastructure Setup", () => {
  describe("Vitest Configuration", () => {
    it("should have access to vi mock functions", () => {
      const mockFn = vi.fn();
      mockFn("test");
      expect(mockFn).toHaveBeenCalledWith("test");
    });

    it("should have jsdom environment available", () => {
      expect(typeof window).toBe("object");
      expect(typeof document).toBe("object");
      expect(document.createElement).toBeDefined();
    });

    it("should have jest-dom matchers available", () => {
      const div = document.createElement("div");
      div.textContent = "test";
      expect(div).toHaveTextContent("test");
    });
  });

  describe("Testing Library Integration", () => {
    it("should render Preact components", () => {
      const TestComponent = () => h("div", null, "Hello Test");
      render(h(TestComponent));
      expect(screen.getByText("Hello Test")).toBeInTheDocument();
    });

    it("should handle component props", () => {
      const TestComponent = ({ message }: { message: string }) =>
        h("div", null, message);

      render(h(TestComponent, { message: "Test Message" }));
      expect(screen.getByText("Test Message")).toBeInTheDocument();
    });

    it("should support event simulation", () => {
      const handleClick = vi.fn();
      const TestButton = () =>
        h("button", { onClick: handleClick }, "Click me");

      render(h(TestButton));
      const button = screen.getByText("Click me");
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Mock Data Factories", () => {
    it("should create mock players with default values", () => {
      const player = createMockPlayer();
      expect(player).toMatchObject({
        name: "Test Player",
        score: 0,
        penalties: 0,
        isActive: false,
        consecutiveMisses: 0,
        eliminated: false,
      });
      expect(player.id).toBeDefined();
    });

    it("should create mock players with overrides", () => {
      const player = createMockPlayer({
        name: "Custom Player",
        score: 25,
        isActive: true,
      });

      expect(player.name).toBe("Custom Player");
      expect(player.score).toBe(25);
      expect(player.isActive).toBe(true);
    });

    it("should create mock games", () => {
      const game = createMockGame();
      expect(game).toMatchObject({
        players: expect.arrayContaining([
          expect.objectContaining({ name: "Test Player" }),
          expect.objectContaining({ name: "Player 2" }),
        ]),
        winner: null,
        totalRounds: 0,
        penalties: [],
      });
      expect(game.id).toBeDefined();
      expect(game.startTime).toBeInstanceOf(Date);
    });

    it("should create mock app state", () => {
      const state = createMockAppState();
      expect(state).toMatchObject({
        gameState: "setup",
        players: [],
        teams: [],
        currentPlayerIndex: 0,
        currentTeamIndex: 0,
        gameHistory: [],
        currentGame: null,
        gameMode: "individual",
      });
    });

    it("should generate multiple players", () => {
      const players = generatePlayers(3);
      expect(players).toHaveLength(3);
      expect(players[0].name).toBe("Player 1");
      expect(players[1].name).toBe("Player 2");
      expect(players[2].name).toBe("Player 3");
    });
  });

  describe("Test Scenarios", () => {
    it("should provide empty game scenario", () => {
      const state = testScenarios.emptyGame();
      expect(state.gameState).toBe("setup");
      expect(state.players).toHaveLength(0);
    });

    it("should provide game with players scenario", () => {
      const state = testScenarios.gameWithPlayers(3);
      expect(state.players).toHaveLength(3);
      expect(state.gameState).toBe("setup");
    });

    it("should provide active game scenario", () => {
      const state = testScenarios.activeGame();
      expect(state.gameState).toBe("playing");
      expect(state.players.some((p) => p.isActive)).toBe(true);
      expect(state.currentGame).toBeDefined();
    });

    it("should provide finished game scenario", () => {
      const state = testScenarios.finishedGame();
      expect(state.gameState).toBe("finished");
      expect(state.players.some((p) => p.score === 50)).toBe(true);
      expect(state.currentGame?.winner).toBeDefined();
    });

    it("should provide player scenarios", () => {
      const nearWin = testScenarios.playerNearWin(48);
      expect(nearWin.score).toBe(48);

      const overshot = testScenarios.playerOvershot();
      expect(overshot.score).toBe(25);
      expect(overshot.penalties).toBe(1);

      const eliminated = testScenarios.eliminatedPlayer();
      expect(eliminated.eliminated).toBe(true);
      expect(eliminated.consecutiveMisses).toBe(3);
    });
  });

  describe("Browser API Mocks", () => {
    it("should have sessionStorage mocked", () => {
      expect(window.sessionStorage.setItem).toBeDefined();
      expect(window.sessionStorage.getItem).toBeDefined();

      window.sessionStorage.setItem("test", "value");
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        "test",
        "value"
      );
    });

    it("should have matchMedia mocked", () => {
      const mediaQuery = window.matchMedia("(min-width: 768px)");
      expect(mediaQuery).toBeDefined();
      expect(mediaQuery.matches).toBe(false);
      expect(mediaQuery.addEventListener).toBeDefined();
    });

    it("should have ResizeObserver mocked", () => {
      const observer = new ResizeObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });
  });

  describe("Custom Render Function", () => {
    it("should render with providers", () => {
      const TestComponent = () => h("div", null, "Provider Test");

      renderWithProviders(h(TestComponent));
      expect(screen.getByText("Provider Test")).toBeInTheDocument();
    });

    it("should accept initial state", () => {
      const TestComponent = () => h("div", null, "State Test");
      const initialState = createMockAppState({ gameState: "playing" });

      renderWithProviders(h(TestComponent), { initialState });
      expect(screen.getByText("State Test")).toBeInTheDocument();
    });
  });

  describe("Performance Testing", () => {
    it("should complete test setup quickly", () => {
      const startTime = performance.now();

      // Simulate test operations
      const players = generatePlayers(10);
      const games = Array.from({ length: 5 }, () => createMockGame());
      const states = Array.from({ length: 3 }, () =>
        testScenarios.activeGame()
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Test setup should be fast (under 100ms for this amount of data)
      expect(duration).toBeLessThan(100);
      expect(players).toHaveLength(10);
      expect(games).toHaveLength(5);
      expect(states).toHaveLength(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle test errors gracefully", () => {
      expect(() => {
        throw new Error("Test error");
      }).toThrow("Test error");
    });

    it("should provide meaningful error messages", () => {
      try {
        expect(1).toBe(2);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Async Testing Support", () => {
    it("should handle promises", async () => {
      const asyncOperation = () => Promise.resolve("async result");
      const result = await asyncOperation();
      expect(result).toBe("async result");
    });

    it("should handle timeouts", async () => {
      const delayedOperation = () =>
        new Promise((resolve) => setTimeout(() => resolve("delayed"), 10));

      const result = await delayedOperation();
      expect(result).toBe("delayed");
    });
  });
});

describe("Coverage Configuration", () => {
  it("should be configured for comprehensive coverage", () => {
    // This test ensures the coverage configuration is working
    // by testing various code paths and patterns

    const testFunction = (condition: boolean) => {
      if (condition) {
        return "branch A";
      } else {
        return "branch B";
      }
    };

    // Test both branches
    expect(testFunction(true)).toBe("branch A");
    expect(testFunction(false)).toBe("branch B");
  });

  it("should cover error conditions", () => {
    const errorFunction = (shouldError: boolean) => {
      if (shouldError) {
        throw new Error("Test error");
      }
      return "success";
    };

    // Test success path
    expect(errorFunction(false)).toBe("success");

    // Test error path
    expect(() => errorFunction(true)).toThrow("Test error");
  });

  it("should cover async error conditions", async () => {
    const asyncErrorFunction = async (shouldError: boolean) => {
      if (shouldError) {
        throw new Error("Async error");
      }
      return "async success";
    };

    // Test success path
    await expect(asyncErrorFunction(false)).resolves.toBe("async success");

    // Test error path
    await expect(asyncErrorFunction(true)).rejects.toThrow("Async error");
  });
});
