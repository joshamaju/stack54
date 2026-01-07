import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["test/apps", "node_modules", "dist"],
  },
});
