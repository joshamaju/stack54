import type {
  Integration,
  UserConfig,
  ResolvedConfig,
} from "../core/config/index.js";
import { Command } from "../core/types.js";

export const defineConfig = <
  T extends UserConfig | ((command: Command) => UserConfig)
>(
  config: T
): T => config;

export const defineIntegration = (config: Integration): Integration => config;

export type { Integration, UserConfig, ResolvedConfig };
