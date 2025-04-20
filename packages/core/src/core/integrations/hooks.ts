import type { Env, ResolvedConfig } from "../config/index.js";
import { merge } from "../config/merge.js";

export async function run_config_setup(
  config: ResolvedConfig,
  env: Env
): Promise<ResolvedConfig> {
  const { integrations } = config;

  let merged = config;

  for (const integration of integrations) {
    const config = await integration.config?.call(integration, merged, env);
    if (config) merged = merge(merged, config) as ResolvedConfig;
  }

  return merged;
}

export async function run_config_resolved(config: ResolvedConfig) {
  for (const integration of config.integrations) {
    await integration.configResolved?.call(integration, config);
  }
}

export async function run_build_start(config: ResolvedConfig) {
  for (const integration of config.integrations) {
    await integration.buildStart?.call(integration);
  }
}

export async function run_build_end(config: ResolvedConfig) {
  for (const integration of config.integrations) {
    await integration.buildEnd?.call(integration);
  }
}

export async function run_html_pre_transform(
  config: ResolvedConfig,
  { code, filename }: { code: string; filename: string }
) {
  const { integrations } = config;

  let _code = code;

  for (const integration of integrations) {
    const v = integration.transform;

    if (v && typeof v !== "function" && v.order == "pre") {
      const code = await v.handle.call(integration, _code, filename);
      if (code) _code = code;
    }
  }

  return _code;
}

export async function run_html_post_transform(
  config: ResolvedConfig,
  { code, filename }: { code: string; filename: string }
) {
  const { integrations } = config;

  let _code = code;

  for (const integration of integrations) {
    let fn;

    const value = integration.transform;

    if (value) {
      if (typeof value == "function") {
        fn = value;
      } else if (value.order == "post") {
        fn = value.handle;
      }
    }

    if (fn) {
      const code = await fn.call(integration, _code, filename);
      if (code) _code = code;
    }
  }

  return _code;
}
