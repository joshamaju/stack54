// @ts-check

import hono from "@hono/vite-dev-server";
import { defineConfig } from "stack54/config";

export default defineConfig({
  views: ["src/views/**/*.{entry,page}.svelte"],
  vite: {
    plugins: [hono({ entry: "src/entry.ts" })],
  },
});
