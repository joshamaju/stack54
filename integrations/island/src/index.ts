import * as path from "node:path";
import type { Plugin } from "vite";
import { Integration, ResolvedConfig } from "stack54/config";
import { makeIsland } from "./process.js";

type Island = { code: string; original: string; complete: boolean };

export default function islandIntegration(): Integration {
  let config: ResolvedConfig;
  let env: { command: string };

  let islands = new Map<string, Island>();

  function vitePlugin(): Plugin {
    return {
      name: "stack54:island",
      load: {
        order: "pre",
        handler(id) {
          const [filename] = id.split("?");

          const is_view = config.svelte.extensions.includes(
            path.extname(filename)
          );

          /**
           * We wrap the original component and insert a script that imports itself
           * for hydration on the client. We need to ensure that the client script doesn't
           * load the wrapped version, but the original version, to avoid recursively making it an island
           */
          if (is_view) {
            const island = islands.get(id);

            if (island) {
              islands.set(id, { ...island, complete: true });
              return island.original;
            }
          }
        },
      },
      configureServer(server) {
        const fn = (file: string) => {
          if (islands.has(file)) islands.delete(file);
        };

        server.watcher.on("change", fn);
        server.watcher.on("unlink", fn);
      },
      transform: {
        order: "pre",
        async handler(code, id) {
          if (env.command == "build") return;

          const [filename] = id.split("?");

          const is_view = config.svelte.extensions.includes(
            path.extname(filename)
          );

          if (is_view) {
            /**
             * If this is a second pass/transform as a result of the client script,
             * we need to skip making it an island to avoid recursive loads and transforms.
             *
             * This indicates that the cycle is complete, we've loaded the wrapped island server side
             * which gets sent to the browser as plain HTML that includes the hydration script which
             * triggered another import resolution to the original svelte component.
             *
             * So we remove every reference to this component to avoid returning old code on any other request
             */
            const processed_island = islands.get(id);

            if (processed_island?.complete) {
              islands.delete(id);
              return;
            }

            const island = await makeIsland(code, filename, config);

            if (island) {
              islands.set(id, {
                complete: false,
                original: code,
                code: island,
              });
              return island;
            }
          }
        },
      },
    };
  }

  return {
    name: "stack54:island",
    config(_, env_) {
      env = env_;

      return {
        vite: {
          plugins: [vitePlugin()],
        },
      };
    },
    configResolved(config_) {
      config = config_;
    },
    transform: {
      order: "pre",
      async handle(code, id) {
        const [filename] = id.split("?");
        const island = await makeIsland(code, filename, config);
        return island;
      },
    },
  };
}
