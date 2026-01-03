import { defineConfig } from "stack54/config";
import express from "@stack54/express/plugin";

export default defineConfig({
  entry: ["src/main.ts"],
  integrations: [express()],
});
