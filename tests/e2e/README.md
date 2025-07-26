<!-- @format -->

# End-to-End Tests with Playwright

This directory contains Playwright end-to-end tests for the Mölkky Score Counter application.

## Structure

- `specs/` - Test specifications organized by feature
- `pages/` - Page Object Model classes for maintainable test code
- `fixtures/` - Test fixtures and custom Playwright fixtures
- `utils/` - Utility functions and helpers for tests
- `global-setup.ts` - Global setup that runs before all tests
- `global-teardown.ts` - Global teardown that runs after all tests

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

## Configuration

Test configuration is in `playwright.config.ts` at the project root.

Key settings:

- Tests run against `http://localhost:4173` (preview server)
- Screenshots and videos captured on failure
- Traces collected on retry
- HTML, JSON, and JUnit reports generated
