import { Plugin } from "vite";
import { ResolvedConfig } from "../../config/index.js";
import { resolve } from "../../utils/integration.js";

export function integrations_container_plugin(config: ResolvedConfig): Plugin {
  return {
    name: "stack54:integrations",
    async configureServer(server) {
      const callbacks = await Promise.all(
        config.integrations.map(async (integration) => {
          const plugin = await resolve(integration);
          return plugin.configureServer?.call(plugin, server);
        })
      );

      /** Vite calls this disposer when the dev server closes or is replaced. */
      return () => {
        callbacks.forEach((fn) => fn?.());
      };
    },
  };
}
