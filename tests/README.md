<!-- @format -->

# Mölkky Score Counter - Testing Suite

## Overview

This document outlines the comprehensive testing suite for the Mölkky Score Counter application. The testing infrastructure is built using Vitest with @testing-library/preact for component testing.

## Testing Configuration

### Test Runner: Vitest

- **Environment**: jsdom (for DOM testing)
- **Coverage Provider**: v8
- **Setup Files**: `tests/setup.ts`
- **Global Test Functions**: Enabled

### Coverage Configuration

- **Reporters**: text, json, html
- **Thresholds**: 80% for branches, functions, lines, and statements
- **Excluded**: node_modules, tests, dist, config files

## Test Structure

```
tests/
├── components/          # Component unit tests
├── context/            # Context provider tests
├── hooks/              # Custom hooks tests
├── integration/        # Integration tests
├── utils/              # Utility function tests
├── setup.ts           # Test setup configuration
└── README.md          # This file
```

## Test Categories

### 1. Unit Tests

#### Utility Functions (`tests/utils/`)

- ✅ `gameLogic.test.ts` - Core game logic engine
- ✅ `validation.test.ts` - Input validation functions
- ✅ `gameStateUtils.test.ts` - Game state management utilities
- ✅ `sessionStorage.test.ts` - Session storage operations
- ✅ `types.test.ts` - Type definitions and interfaces

#### Component Tests (`tests/components/`)

- ⚠️ `ScoreInput.test.tsx` - Score input component (needs updates for new UI)
- ⚠️ `GameBoard.test.tsx` - Game board display component
- ⚠️ `PlayerManager.test.tsx` - Player management component
- ✅ `GameHistory.test.tsx` - Game history component
- ✅ `WinnerDisplay.test.tsx` - Winner display component
- ✅ `NoWinnerDisplay.test.tsx` - No winner display component

#### Context Tests (`tests/context/`)

- ✅ `GameContext.test.tsx` - Game context provider and reducer

#### Hook Tests (`tests/hooks/`)

- ✅ `useGameFlow.test.tsx` - Game flow management hook
- ✅ `useGameHistory.test.tsx` - Game history management hook
- ✅ `usePlayerManagement.test.tsx` - Player management hook
- ⚠️ `stateManagementIntegration.test.tsx` - State management integration

### 2. Integration Tests (`tests/integration/`)

- ⚠️ `gameFlow.test.tsx` - Complete game flow testing
- ✅ `gameLogicIntegration.test.ts` - Game logic integration
- ✅ `resetFunctionality.test.tsx` - Reset functionality testing

## Current Test Status

### Passing Tests: 250/370 (67.6%)

### Failing Tests: 120/370 (32.4%)

### Main Issues

1. **UI Interface Changes**: Many component tests expect the old text input interface but the app now uses a pin selection interface
2. **Scoring Type Validation**: Some tests use invalid score/type combinations
3. **Component Structure Changes**: Tests reference UI elements that no longer exist

## Running Tests

### Basic Test Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests with coverage in watch mode
npm run test:coverage:watch
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **Console**: Displayed after test run
- **HTML**: `coverage/index.html` (detailed interactive report)
- **JSON**: `coverage/coverage-final.json` (machine-readable)

## Test Writing Guidelines

### Component Testing

```typescript
import { render, screen, fireEvent } from "@testing-library/preact";
import { GameProvider } from "../../src/context/GameContext";
import { Component } from "../../src/components/Component";

// Always wrap components that use context
function renderWithContext(props = {}) {
  return render(
    <GameProvider>
      <Component {...props} />
    </GameProvider>
  );
}

describe("Component", () => {
  it("should render correctly", () => {
    renderWithContext();
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from "@testing-library/preact";
import { GameProvider } from "../../src/context/GameContext";
import { useCustomHook } from "../../src/hooks/useCustomHook";

function wrapper({ children }) {
  return <GameProvider>{children}</GameProvider>;
}

describe("useCustomHook", () => {
  it("should handle state correctly", () => {
    const { result } = renderHook(() => useCustomHook(), { wrapper });

    act(() => {
      result.current.someAction();
    });

    expect(result.current.someState).toBe(expectedValue);
  });
});
```

### Integration Testing

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { App } from "../../src/app";

describe("Integration Test", () => {
  it("should handle complete user workflow", async () => {
    render(<App />);

    // Add players
    const addButton = screen.getByText("Add Player");
    fireEvent.click(addButton);

    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText("Player added")).toBeInTheDocument();
    });
  });
});
```

## Mocking Guidelines

### Session Storage

```typescript
vi.mock("../../src/utils/storage/sessionStorage", () => ({
  sessionStorageUtil: {
    loadAppState: vi.fn(() => null),
    saveAppState: vi.fn(),
    saveCurrentGame: vi.fn(),
    saveGameHistory: vi.fn(),
  },
}));
```

### Context

```typescript
const mockDispatch = vi.fn();
vi.mock("../../src/context/GameContext", () => ({
  useGameContext: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));
```

## Test Maintenance

### Updating Tests for UI Changes

When the UI changes, tests need to be updated to match:

1. **Query Changes**: Update selectors to match new DOM structure
2. **Interaction Changes**: Update user interactions to match new interface
3. **Assertion Changes**: Update expectations to match new behavior

### Adding New Tests

When adding new features:

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test feature workflows
3. **Edge Cases**: Test error conditions and boundary cases
4. **Accessibility**: Test keyboard navigation and screen reader support

## Performance Testing

### Test Performance Guidelines

- Keep tests focused and fast
- Use `vi.mock()` to avoid expensive operations
- Group related tests in describe blocks
- Use `beforeEach`/`afterEach` for setup/cleanup

### Debugging Slow Tests

```bash
# Run tests with timing information
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- tests/components/Component.test.tsx
```

## Continuous Integration

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests:

```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test"
```

### GitHub Actions

Example workflow for CI:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Future Improvements

### Test Coverage Goals

- Increase overall coverage to 90%+
- Focus on critical game logic paths
- Add more edge case testing
- Improve integration test coverage

### Test Quality Improvements

- Add visual regression testing
- Add performance benchmarking
- Add accessibility testing
- Add cross-browser testing

### Automation

- Automated test generation for new components
- Automated coverage reporting
- Automated test maintenance for UI changes
