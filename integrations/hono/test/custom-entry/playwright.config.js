import { defineConfig, devices } from "@playwright/test";
import port from "./get-port.js";

export default defineConfig({
  timeout: 45000,
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
