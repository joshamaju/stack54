import { ResolvedConfig } from "../config/index.js";
import { getSvelte } from "./vite.js";

export function makeSettings(user_config: ResolvedConfig): ResolvedConfig {
  return {
    ...user_config,
    svelte: getSvelte(user_config),
  };
}
