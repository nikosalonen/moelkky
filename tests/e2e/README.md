<!-- @format -->

# End-to-End Tests with Playwright

This directory contains Playwright end-to-end tests for the Mölkky Score Counter application.

## Structure

- `specs/` - Test specifications organized by feature
- `pages/` - Page Object Model classes for maintainable test code
  - `BasePage.ts` - Base page class with common interactions and utilities
- `fixtures/` - Test fixtures and custom Playwright fixtures
  - `index.ts` - Custom fixtures for game testing scenarios and data
- `utils/` - Utility functions and helpers for tests
  - `testHelpers.ts` - Game-specific assertions, data generation, and flow utilities
  - `index.ts` - Exports for easy importing
- `global-setup.ts` - Global setup that runs before all tests
- `global-teardown.ts` - Global teardown that runs after all tests

## Base Infrastructure

### BasePage Class

All page objects extend the `BasePage` class which provides:

- Common page interactions (click, fill, wait, etc.)
- Element visibility and state checking
- Screenshot and debugging utilities
- Accessibility assertion helpers
- Network and loading state management

### Test Fixtures

Custom Playwright fixtures provide:

- `gameData` - Test data generation for various game scenarios
- `gameSetup` - Common game setup operations and state management
- Pre-built scenarios for individual/team games, edge cases, and complex flows

### Test Helpers

Game-specific utilities include:

- **Assertions**: Game state, player scores, winners, teams, accessibility
- **Data Generation**: Random players, scores, complex scenarios
- **Game Flow**: Setup, start, scoring, penalties, reset operations
- **UI Interactions**: Retry logic, validation, stable UI waiting
- **Performance**: Load time measurement, memory usage checking
- **Debug**: State logging, element inspection, manual pauses

## Running Tests

```bash
# Run all e2e tests (headless)
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Run tests in debug mode (step through tests)
npm run test:e2e:debug

# Run tests with Playwright UI
npm run test:e2e:ui

# View test report
npm run test:e2e:report

# Run both unit and e2e tests
npm run test:all
```

## Browser Support

Tests run against:

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Usage Examples

### Basic Test Structure

```typescript
import { test, expect } from "../fixtures";
import { createGameHelpers } from "../utils";

test.describe("Game Flow", () => {
  test("should complete a basic game", async ({
    page,
    gameData,
    gameSetup,
  }) => {
    const helpers = createGameHelpers(page);

    // Setup game scenario
    const scenario = gameData.basicIndividualGame(2);
    await gameSetup.setupGameScenario(scenario);

    // Start and play game
    await gameSetup.startGame();
    await helpers.gameFlow.submitScore(50);

    // Verify winner
    await helpers.assertions.gameState("finished");
    await helpers.assertions.gameWinner("Player 1");
  });
});
```

### Using Page Objects

```typescript
import { BasePage } from "../pages/BasePage";

class GameSetupPage extends BasePage {
  async addPlayer(name: string) {
    await this.fillInput('[data-testid="player-name-input"]', name);
    await this.clickElement('[data-testid="add-player-button"]');
  }
}
```

### Custom Assertions

```typescript
// Game-specific assertions
await helpers.assertions.playerScore("Alice", 25);
await helpers.assertions.currentPlayer("Bob");
await helpers.assertions.teamExists("Team A");

// Accessibility checks
await helpers.assertions.accessibility();
await helpers.assertions.noConsoleErrors();
```

## Configuration

Test configuration is in `playwright.config.ts` at the project root.

Key settings:

- Tests run against `http://localhost:4173` (preview server)
- Screenshots and videos captured on failure
- Traces collected on retry
- HTML, JSON, and JUnit reports generated
