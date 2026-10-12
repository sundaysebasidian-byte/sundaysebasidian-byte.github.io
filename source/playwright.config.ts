import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 180000,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "evidence/notebook-scenes-v13/browser-tests.json" }],
  ],
  use: {
    actionTimeout: 15000,
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    headless: true,
    viewport: { width: 1365, height: 1050 },
    trace: "retain-on-failure",
  },
});
