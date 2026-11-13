import { defineConfig } from "@playwright/test";
import production from "./playwright.config";

export default defineConfig({
  ...production,
  testMatch: undefined,
  testIgnore: [
    "**/exam-preview/**",
    "**/private-exam-production.spec.ts",
    "**/public-calendar.spec.ts",
  ],
  timeout: 60000,
  use: { ...production.use, baseURL: "http://127.0.0.1:3002" },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3002",
    url: "http://127.0.0.1:3002",
    reuseExistingServer: false,
    timeout: 120000,
    env: { EUC_BROWSER_FIXTURES: "1", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
