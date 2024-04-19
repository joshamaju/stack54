import { defineConfig } from "vite";
import fullstack from "stack54/vite";

export default defineConfig({
  plugins: [fullstack()],
  build: {
    rollupOptions: {
      input: {server: './src/server.ts'}
    }
  },
});
