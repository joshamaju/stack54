import { Integration, ResolvedConfig } from "stack54/config";
import pkg from '../../package.json' with {type: 'json'}
import { devServer } from "./server.js";
import { glob } from "glob";

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
        console.error(`${pkg.name}: config entry must be a string`);
        process.exit(1);
      }

      return async () => {
        const file = await glob(entry, { cwd: process.cwd() });
        return devServer(server, { entry: file[0] });
      };
    },
  };
}
