import { Integration, ResolvedConfig } from "stack54/config";
import pkg from '../../package.json' with {type: 'json'}
import { devServer } from "./server.js";

export default function plugin(opts: { entry?: string } = {}): Integration {
  let config: ResolvedConfig;

  return {
    name: "stack54:hono",
    configResolved(conf) {
      config = conf;
    },
    configureServer(server) {
      const entry = opts.entry ?? config.entry;

      if (typeof entry !== "string") {
        throw new Error(`${pkg.name}: config entry must be a string`);
      }

      return () => devServer(server, { entry });
    },
  };
}
