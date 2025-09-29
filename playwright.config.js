import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Menu Sync QA Tests
 *
 * This configuration is optimized for testing the menu synchronization
 * prevention system across different scenarios and environments.
 */

export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files matching this pattern
  testMatch: ['**/*.test.js'],

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Maximum time for each assertion
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: false, // Disable for menu sync tests to avoid conflicts

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:7001',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Global timeout for all actions
    actionTimeout: 10000,

    // Global timeout for navigation
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Test against mobile viewports for admin panel responsiveness
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Global setup to ensure server is running
  globalSetup: './tests/global-setup.js',

  // Global teardown
  globalTeardown: './tests/global-teardown.js',

  // Run your local dev server before starting the tests
  webServer: {
    command: 'node server.js',
    port: 7001,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Whether to preserve output directory on new runs
  preserveOutput: 'failures-only',
});