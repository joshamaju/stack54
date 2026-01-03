import { defineConfig } from "stack54/config";
import hono from "@stack54/hono/plugin";

export default defineConfig({
  entry: ["src/main.ts"],
  integrations: [hono()],
});
