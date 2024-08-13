import { ResolvedConfig } from "../config/index.js";
import {
  islandPlugin,
  islandIntegration,
} from "../vite-plugins/island/index.js";
import { getSvelte } from "./vite.js";

export function makeSettings(user_config: ResolvedConfig): ResolvedConfig {
  return {
    ...user_config,
    svelte: getSvelte(user_config),
    integrations: [...user_config.integrations, islandIntegration()],
    vite: {
      ...user_config.vite,
      plugins: [...(user_config.vite.plugins ?? []), islandPlugin()],
    },
  };
}
