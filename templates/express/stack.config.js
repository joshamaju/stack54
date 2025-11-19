import express from "@stack54/express/plugin";
import { defineConfig } from "stack54/config";

export default defineConfig({
  integrations: [express()],
  views: ["src/views/**/*.{entry,page}.svelte"],
});
