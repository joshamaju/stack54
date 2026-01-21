import hono from "@stack54/hono/plugin";
import { port } from "@stack54/internal-test-utils";
import streaming from "@stack54/streaming/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [hono(), streaming()],
  vite: {
    server: {
      port: await port(),
    },
  },
  svelte: {
    compilerOptions: {
      preserveComments: true,
    },
  },
});
