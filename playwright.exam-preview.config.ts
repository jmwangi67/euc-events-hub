import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/exam-preview",
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3001",
    timezoneId: "America/Los_Angeles",
    viewport: { width: 1440, height: 1100 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001/planner",
    reuseExistingServer: false,
    timeout: 120000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    // Always invented fixtures; failure artifacts can never capture the owner's source data.
    env: {
      NODE_ENV: "development",
      NEXT_TELEMETRY_DISABLED: "1",
      EUC_PRIVATE_EXAM_PREVIEW: "1",
      EUC_EXAM_PREVIEW_DATASET: "synthetic",
      EUC_EXAM_DATASET_PATH: "",
    },
  },
});
