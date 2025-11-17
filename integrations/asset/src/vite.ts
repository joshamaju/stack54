import { call, createScope, each, spawn, Task } from "effection";
import MagicString from "magic-string";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ConfigEnv, Plugin } from "vite";
import mm from "micromatch";

import { manager as service } from "./manager.js";
import { make_type } from "./utils.js";
import { Config } from "./types.js";

function string(str: string) {
  return JSON.stringify(str);
}

export default function plugin({
  exclude,
  staticDir,
  namespace = "Assets",
  outFile = "public.d.ts",
}: Config = {}): Plugin[] {
  let env: ConfigEnv;

  const [scope, destroy] = createScope();
  let manager: ReturnType<typeof service>;

  const cwd = process.cwd();

  const regex = new RegExp(`${namespace}\\.((?:[\\w$]+(?:\\.[\\w$]+)*))`, "g");

  const setup_plugin: Plugin = {
    name: "@stack54/asset:setup",
    config(_, config_env) {
      env = config_env;
    },
    buildEnd() {
      destroy();
    },
    configResolved(conf) {
      manager = service(path.join(cwd, staticDir || conf.publicDir));

      if (env.command == "serve") {
        const write = function* () {
          const files = yield* manager.files();
          const [assets] = manager.assets(files);
          const type = make_type(namespace, assets);
          yield* call(() => fs.writeFile(path.join(cwd, outFile), type));
        };

        scope.run(function* () {
          yield* manager.crawl();

          yield* write();

          const channel = yield* manager.watch();

          let task: Task<any> | undefined;

          for (const _ of yield* each(channel)) {
            if (task) yield* task.halt();

            task = yield* spawn(function* () {
              yield* manager.crawl();
              yield* write();
            });

            yield* each.next();
          }
        });
      }
    },
  };

  const dev_plugin: Plugin = {
    apply: "serve",
    name: "@stack54/asset:dev",
    configureServer(server) {
    //   server.httpServer?.on("close", () => destroy());
    },
    transform: {
      order: "pre",
      handler(code, id) {
        if (id.includes("node_modules")) return;

        if (exclude && mm.isMatch(id, exclude)) {
          return;
        }

        return scope.run(function* () {
          const files = yield* manager.files();
          const [, assets] = manager.assets(files);

          const s = new MagicString(code);

          s.replace(regex, (match, path) => {
            const value = assets.get(path);
            return value !== undefined ? string(value) : match;
          });

          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          };
        });
      },
    },
  };

  const build_plugin: Plugin = {
    apply: "build",
    name: "@stack54/asset:build",
    config() {
      return scope.run(function* () {
        const files = yield* yield* manager.crawl();
        const [, map] = manager.assets(files);
        const assets = [...map.entries()];

        return {
          define: Object.fromEntries(
            assets.map(([k, v]) => [`${namespace}.${k}`, string(v)])
          ),
        };
      });
    },
  };

  return [setup_plugin, dev_plugin, build_plugin];
}
