import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * B1-C1-R1 authenticated Production browser QA harness.
 * Auth storage under playwright/.auth is gitignored and never printed.
 */
const authFile = path.join(__dirname, "playwright/.auth/production-owner.json");
const baseURL =
  process.env.BROWSER_QA_BASE_URL?.trim() || "https://www.zyntixai.com";

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      testMatch: /.*\.desktop\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["iPhone 13"],
        storageState: authFile,
      },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
    {
      name: "tablet-chromium",
      use: {
        ...devices["iPad Mini"],
        storageState: authFile,
      },
      testMatch: /.*\.tablet\.spec\.ts/,
    },
  ],
});
