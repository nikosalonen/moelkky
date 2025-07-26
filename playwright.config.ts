/** @format */

import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    process.env.CI ? ["github"] : ["list"],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:4173",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Record video on failure */
    video: "retain-on-failure",

    /* Global timeout for each action */
    actionTimeout: 10000,

    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use a consistent viewport for testing
        viewport: { width: 1280, height: 720 },
      },
    },

     {
       name: "firefox",
       use: {
         ...devices["Desktop Firefox"],
         viewport: { width: 1280, height: 720 },
       },
     },

     {
       name: "webkit",
       use: {
         ...devices["Desktop Safari"],
         viewport: { width: 1280, height: 720 },
       },
     },

     /* Test against mobile viewports. */
     {
       name: "Mobile Chrome",
       use: { ...devices["Pixel 5"] },
     },
     {
       name: "Mobile Safari",
       use: { ...devices["iPhone 12"] },
     },

     /* Test against branded browsers. */
     {
       name: 'Microsoft Edge',
       use: { ...devices['Desktop Edge'], channel: 'msedge' },
     },
     {
       name: 'Google Chrome',
       use: { ...devices['Desktop Chrome'], channel: 'chrome' },
     },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global setup and teardown */
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  /* Test timeout */
  timeout: 30 * 1000,
  expect: {
    /* Timeout for expect() assertions */
    timeout: 5000,
  },

  /* Output directories */
  outputDir: "test-results/",
});
