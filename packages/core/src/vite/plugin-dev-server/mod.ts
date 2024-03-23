import { Plugin } from "vite";
import { devServer } from "./server.js";
import { Config } from "../../core/config/options.js";
import { is_view } from "../utils/template.js";

export function plugin_devServer(config: Config): Plugin {
  const entry = config.serverEntry;

  return {
    apply: "serve",
    name: "mpa:dev-server",
    configureServer(server) {
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
