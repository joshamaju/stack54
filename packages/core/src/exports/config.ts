import type {
  Env,
  Integration,
  UserConfig,
  ResolvedConfig,
} from "../core/config/index.js";

export const defineConfig = (config: UserConfig): UserConfig => config;

export const defineIntegration = (config: Integration): Integration => config;

export type { Env, Integration, UserConfig, ResolvedConfig };
