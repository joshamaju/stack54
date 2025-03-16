import { defineConfig } from "stack54/config";
import express from "@stack54/express/plugin";
import island from "../../../dist/index.js"

export default defineConfig({
  integrations: [express(), island()],
});
