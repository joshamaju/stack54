import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "stack54/config";

export default defineConfig({
  entry: "./resources/entry.ts",
  vite: { plugins: [tailwindcss()] },
  build: { outDir: "build", minify: false },
  views: ["./resources/views/**/*.{entry,page}.svelte"],
});
