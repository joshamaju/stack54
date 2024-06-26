import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 45000,
  webServer: {
    port: 4173,
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
