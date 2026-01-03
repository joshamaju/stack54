import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 45000,
  webServer: {
    port: 5173,
    stdout: "pipe",
    stderr: "pipe",
    command: "pnpm dev",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
