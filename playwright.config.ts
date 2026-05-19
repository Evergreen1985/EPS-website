import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,       // sequential — shared live DB
  retries: 1,
  timeout: 60_000,            // 60s — login + test must fit here
  expect: { timeout: 8_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  reporter: [
    ["html", { outputFolder: "tests/reports/html", open: "never" }],
    ["json", { outputFile: "tests/reports/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
