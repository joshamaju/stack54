import { call, Operation, until } from "effection";
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

export function* run_config_setup(
  config: ResolvedConfig,
  env: Env,
): Operation<ResolvedConfig> {
  const plugins = get_plugins(config);

  let merged = config;

  for (const integration of plugins) {
    const plugin = yield* until(resolve(integration));
    const value = plugin.config?.call(plugin, merged, env);
    const config = value instanceof Promise ? yield* until(value) : value;
    if (config) merged = merge(merged, config) as ResolvedConfig;
  }

  return merged;
}

export function* run_config_resolved(config: ResolvedConfig) {
  const plugins = get_plugins(config);

  for (const integration of plugins) {
    const plugin = yield* until(resolve(integration));
    yield* call(async () => plugin.configResolved?.call(plugin, config));
  }
}

export function* run_build_start(config: ResolvedConfig) {
  const plugins = get_plugins(config);

  for (const integration of plugins) {
    const plugin = yield* until(resolve(integration));
    yield* call(async () => plugin.buildStart?.call(plugin));
  }
}

export function* run_build_end(config: ResolvedConfig, manifest: Manifest) {
  const plugins = get_plugins(config);

  for (const integration of plugins) {
    const plugin = yield* until(resolve(integration));
    yield* call(async () => plugin.buildEnd?.call(plugin, manifest));
  }
}

export function* run_html_pre_transform(
  config: ResolvedConfig,
  { code, filename }: { code: string; filename: string },
) {
  const plugins = [
    ...config.integrations,
    ...(config.environments.client?.integrations ?? []),
  ];

  let _code = code;

  for (const integration of plugins) {
    const plugin = yield* until(resolve(integration));
    const can_execute = plugin.environment == "client" || !plugin.environment;
    const v = plugin.transform;

    if (v && can_execute && typeof v !== "function" && v.order == "pre") {
      const value = v.handle.call(plugin, _code, filename);
      const code = yield* call(async () => value);
      if (code) _code = code;
    }
  }

  return _code;
}

export function* run_html_post_transform(
  config: ResolvedConfig,
  { code, filename }: { code: string; filename: string },
) {
  const plugins = [
    ...config.integrations,
    ...(config.environments.client?.integrations ?? []),
  ];

  let _code = code;

  for (const integration of plugins) {
    let fn;

    const plugin = yield* until(resolve(integration));
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
      const code = yield* call(async () => fn.call(plugin, _code, filename));
      if (code) _code = code;
    }
  }

  return _code;
}
