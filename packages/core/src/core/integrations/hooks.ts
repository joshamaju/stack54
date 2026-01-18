import type { Env, ResolvedConfig } from "../config/index.js";
import { merge } from "../config/merge.js";
import { Manifest } from "../types.js";
import { resolve } from "../utils/integration.js";

function get_plugins(config: ResolvedConfig) {
  const plugins = [
    ...config.integrations,
    ...(config.environments.server?.integrations ?? []),
    ...(config.environments.client?.integrations ?? []),
  ];

  return plugins;
}

// function partition(integrations: Integration[]) {
//   const all: Integration[] = [];
//   const client: Integration[] = [];
//   const server: Integration[] = [];

//   for (const plugin of integrations) {
//     if (plugin.environment == "client") client.push(plugin);
//     else if (plugin.environment == "server") server.push(plugin);
//     else all.push(plugin);
//   }

//   return { all, client, server };
// }

export async function run_config_setup(
  config: ResolvedConfig,
  env: Env
): Promise<ResolvedConfig> {
  const plugins = get_plugins(config);

  let merged = config;

  for (const integration of plugins) {
    const plugin = await resolve(integration);
    const config = await plugin.config?.call(plugin, merged, env);
    if (config) merged = merge(merged, config) as ResolvedConfig;
  }

  return merged;
}

export async function run_config_resolved(config: ResolvedConfig) {
  const plugins = get_plugins(config);

  for (const integration of plugins) {
    const plugin = await resolve(integration);
    await plugin.configResolved?.call(plugin, config);
  }
}

export async function run_build_start(config: ResolvedConfig) {
  const plugins = get_plugins(config);

  for (const integration of plugins) {
    const plugin = await resolve(integration);
    await plugin.buildStart?.call(plugin);
  }
}

export async function run_build_end(
  config: ResolvedConfig,
  manifest: Manifest
) {
  const plugins = get_plugins(config);

  for (const integration of plugins) {
    const plugin = await resolve(integration);
    await plugin.buildEnd?.call(plugin, manifest);
  }
}

export async function run_html_pre_transform(
  config: ResolvedConfig,
  { code, filename }: { code: string; filename: string }
) {
  const plugins = [
    ...config.integrations,
    ...(config.environments.client?.integrations ?? []),
  ];

  let _code = code;

  for (const integration of plugins) {
    const plugin = await resolve(integration);
    const can_execute = plugin.environment == "client" || !plugin.environment;
    const v = plugin.transform;

    if (v && can_execute && typeof v !== "function" && v.order == "pre") {
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
  const plugins = [
    ...config.integrations,
    ...(config.environments.client?.integrations ?? []),
  ];

  let _code = code;

  for (const integration of plugins) {
    let fn;

    const plugin = await resolve(integration);
    const can_execute = plugin.environment == "client" || !plugin.environment;
    const value = plugin.transform;

    if (value && can_execute) {
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
