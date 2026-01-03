import type { Integration, ResolvedConfig } from "stack54/config";
import { glob } from "glob";
import pkg from '../../package.json' with {type: 'json'}
import { devServer } from "./server.js";

export default function plugin(opts: { entry?: string } = {}): Integration {
  let config: ResolvedConfig;

  return {
    name: "@stack54/express",
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
        devServer(server, { entry: file[0] });
      };
    },
  };
}
