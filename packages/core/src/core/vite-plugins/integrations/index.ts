import { Plugin } from "vite";
import { ResolvedConfig } from "../../config/index.js";
import { runPostTransform, runPreTransform } from "../../integrations/hooks.js";

export function integrationsContainerPlugin(config: ResolvedConfig): Plugin {
  return {
    name: "stack54:integrations",
    async configureServer(server) {
      const callbacks = await Promise.all(
        config.integrations.map((plugin) => {
          return plugin.configureServer?.call(plugin, server);
        })
      );

      return () => {
        callbacks.forEach((fn) => fn?.());
      };
    },
  };
}

export function integrationsContainerPluginPre(config: ResolvedConfig): Plugin {
  return {
    name: "stack54:integrations:pre",
    transform: {
      order: "pre",
      handler(code, filename, { ssr = true } = {}) {
        return runPreTransform(config, { ssr, code, filename });
      },
    },
  };
}

export function integrationsContainerPluginPost(
  config: ResolvedConfig
): Plugin {
  return {
    name: "stack54:integrations:post",
    transform: {
      order: "post",
      handler(code, filename, { ssr = true } = {}) {
        return runPostTransform(config, { ssr, code, filename });
      },
    },
  };
}
