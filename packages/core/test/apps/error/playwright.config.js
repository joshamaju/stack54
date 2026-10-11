import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 45000,
  // Route relative page.goto() paths to this app's non-default preview port.
  use: { baseURL: "http://localhost:3001" },
  webServer: {
    port: 3001,
    stdout: 'pipe',
    stderr: 'pipe',
    command: "pnpm build && pnpm preview",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
