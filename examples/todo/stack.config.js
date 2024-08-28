import express from "@stack54/express/plugin";
import island from '@stack54/island'
import { defineConfig } from "stack54/config";

export default defineConfig({
  views: ['src/views/**/*.svelte'],
  integrations: [express(), island()],
});
