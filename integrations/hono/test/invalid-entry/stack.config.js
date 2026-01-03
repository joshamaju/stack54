import { defineConfig } from "stack54/config";
import hono from "@stack54/hono/plugin";
import port from "./get-port.js";

export default defineConfig({
  entry: ["src/main.ts"],
  integrations: [hono()],
  vite: {
    server: {
      port: await port(),
    },
  },
});
