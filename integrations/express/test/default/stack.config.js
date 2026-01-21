import { defineConfig } from "stack54/config";
import express from "@stack54/express/plugin";
import streaming from "@stack54/streaming/plugin";
import { port } from "@stack54/internal-test-utils";

export default defineConfig({
  integrations: [express(), streaming()],
  vite: {
    server: {
      port: await port(),
    },
  },
});
