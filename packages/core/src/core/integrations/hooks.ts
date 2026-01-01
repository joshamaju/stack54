import type { Env, ResolvedConfig } from "../config/index.js";
import { merge } from "../config/merge.js";
import { Manifest } from "../types.js";
import { resolve } from "../utils/integration.js";

export async function run_config_setup(
  config: ResolvedConfig,
  env: Env
): Promise<ResolvedConfig> {
  const { integrations } = config;

  let merged = config;

  for (const integration of integrations) {
    const plugin = await resolve(integration);
    const config = await plugin.config?.call(plugin, merged, env);
    if (config) merged = merge(merged, config) as ResolvedConfig;
  }

  return merged;
}

export async function run_config_resolved(config: ResolvedConfig) {
  for (const integration of config.integrations) {
    const plugin = await resolve(integration);
    await plugin.configResolved?.call(plugin, config);
  }
}

export async function run_build_start(config: ResolvedConfig) {
  for (const integration of config.integrations) {
    const plugin = await resolve(integration);
    await plugin.buildStart?.call(plugin);
  }
}

export async function run_build_end(
  config: ResolvedConfig,
  manifest: Manifest
) {
  for (const integration of config.integrations) {
    const plugin = await resolve(integration);
    await plugin.buildEnd?.call(plugin, manifest);
  }
}

export async function run_html_pre_transform(
  config: ResolvedConfig,
  { code, filename }: { code: string; filename: string }
) {
  const { integrations } = config;

  let _code = code;

  for (const integration of integrations) {
    const plugin = await resolve(integration);
    const v = plugin.transform;

    if (v && typeof v !== "function" && v.order == "pre") {
      const code = await v.handle.call(plugin, _code, filename);
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

    const plugin = await resolve(integration);
    const value = plugin.transform;

    if (value) {
      if (typeof value == "function") {
        fn = value;
      } else if (value.order == "post") {
        fn = value.handle;
      }
    }

    if (fn) {
      const code = await fn.call(plugin, _code, filename);
      if (code) _code = code;
    }
  }

  return _code;
}
