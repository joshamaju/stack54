import { defineConfig } from "stack54/config";
import plugin from "@stack54/express/plugin";

export default defineConfig({
  integrations: [plugin()],
});
