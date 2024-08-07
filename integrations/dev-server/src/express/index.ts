import { Integration, ResolvedConfig } from "stack54/config";
import { devServer, previewServer } from "./server.js";

export default function plugin_devServer(): Integration {
  let config: ResolvedConfig;

  return {
    name: "stack54:express",
    configResolved(conf) {
      config = conf;
    },
    configurePreviewServer(server) {
      return () => previewServer(server);
    },
    configureServer(server) {
      const { entry } = config;
      return () => devServer(server, { entry });
    },
  };
}
