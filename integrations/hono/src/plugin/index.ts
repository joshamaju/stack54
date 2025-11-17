import { Integration, ResolvedConfig } from "stack54/config";
import { devServer } from "./server.js";

export default function plugin(): Integration {
  let config: ResolvedConfig;

  return {
    name: "stack54:hono",
    configResolved(conf) {
      config = conf;
    },
    configureServer(server) {
      // @ts-expect-error
      return () => devServer(server, config);
    },
  };
}
