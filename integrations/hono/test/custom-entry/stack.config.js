import { defineConfig } from "stack54/config";
import hono from "@stack54/hono/plugin";
import { port } from "@stack54/internal-test-utils";

export default defineConfig({
  integrations: [hono({ entry: "src/main.ts" })],
  vite: {
    server: {
      port: await port(),
    },
  },
});
