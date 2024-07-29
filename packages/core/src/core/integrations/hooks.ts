import type { ResolvedConfig } from "../config/index.js";
import { merge } from "../config/merge.js";

export async function runConfigSetup(
  config: ResolvedConfig
): Promise<ResolvedConfig> {
  const { integrations } = config;

  let merged_config = config;

  for (const integration of integrations) {
    const config = await integration.config?.call(integration, merged_config);
    if (config) merged_config = merge(merged_config, config) as ResolvedConfig;
  }

  return merged_config;
}

export async function runConfigResolved(config: ResolvedConfig) {
  for (const integration of config.integrations) {
    await integration.configResolved?.call(integration, config);
  }
}
