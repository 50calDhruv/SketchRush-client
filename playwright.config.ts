import { defineConfig, devices } from "@playwright/test";

/** End-to-end: boots the game server and the Vite dev server, then plays real games in Chromium. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev",
      cwd: "../SketchRush-server",
      url: "http://localhost:5000/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
