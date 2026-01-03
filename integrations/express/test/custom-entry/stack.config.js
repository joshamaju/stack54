import { defineConfig } from "stack54/config";
import express from "@stack54/express/plugin";
import { port } from "@stack54/internal-test-utils";

export default defineConfig({
  integrations: [express({ entry: "src/main.ts" })],
  vite: {
    server: {
      port: await port(),
    },
  },
});
