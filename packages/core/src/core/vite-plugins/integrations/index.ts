import { Plugin } from "vite";
import { ResolvedConfig } from "../../config/index.js";

export function integrations_container_plugin(config: ResolvedConfig): Plugin {
  return {
    name: "stack54:integrations",
    async configureServer(server) {
      const callbacks = await Promise.all(
        config.integrations.map(async (integration) => {
          const plugin =
            integration instanceof Promise ? await integration : integration;
          return plugin.configureServer?.call(plugin, server);
        })
      );

      return () => {
        callbacks.forEach((fn) => fn?.());
      };
    },
  };
}
