import express from "@stack54/express/plugin";
import { defineConfig } from "stack54/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [express()],
  vite: { plugins: [tailwindcss()] },
  views: ["src/views/**/*.{entry,page}.svelte"],
});
