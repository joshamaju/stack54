import type {
  Integration,
  UserConfig,
  ResolvedConfig,
} from "../core/config/index.js";

export const defineConfig = (config: UserConfig): UserConfig => config;

export const defineIntegration = (config: Integration): Integration => config;

export type { Integration, UserConfig, ResolvedConfig };
