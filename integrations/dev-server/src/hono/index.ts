import { Integration, ResolvedConfig } from "stack54/config";

import { devServer, previewServer } from "./server.js";

export default function plugin_devServer(): Integration {
  let config: ResolvedConfig;

  return {
    name: "stack54:hono-dev-server",
    configResolved(conf) {
      config = conf;
    },
    configurePreviewServer(server) {
      return () => previewServer(server);
    },
    configureServer(server) {
      const { entry } = config;

      return () => {
        server.watcher.on("change", (file) => {
          if (file.endsWith(entry)) {
            server.ws.send({ type: "full-reload" });
          }
        });

        return devServer(server, { entry });
      };
    },
  };
}
