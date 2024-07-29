import { Plugin } from "vite";
import { ResolvedConfig } from "../../config/index.js";

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
