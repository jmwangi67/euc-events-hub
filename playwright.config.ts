import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/exam-preview/**",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    timezoneId: "America/Los_Angeles",
    viewport: { width: 1440, height: 1100 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1",
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      EUC_PRIVATE_EXAM_PREVIEW: "1",
      EUC_EXAM_PREVIEW_DATASET: "synthetic",
    },
  },
});
