import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "stack54/config";

export default defineConfig({
  build: { outDir: "build" },
  entry: "./resources/entry.ts",
  vite: { plugins: [tailwindcss()] },
  views: ["./resources/views/**/*.{entry,page}.svelte"],
});
