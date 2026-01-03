import { defineConfig, devices } from "@playwright/test";
import { port } from "@stack54/internal-test-utils";

export default defineConfig({
  timeout: 45000,
  testDir: "test/e2e",
  webServer: {
    stdout: "pipe",
    stderr: "pipe",
    port: await port(),
    command: "pnpm dev",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
