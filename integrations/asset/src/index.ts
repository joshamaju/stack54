// import * as fs from "node:fs";
// import * as path from "node:path";
// import type { Env, Integration, ResolvedConfig } from "stack54/config";
// import type { Plugin } from "vite";

// import { AssetManager } from "./manager.js";
// import { make_type } from "./utils.js";

// type Config = { outFile?: string; namespace?: string };

// export default function plugin({
//   namespace = "Assets",
//   outFile = "public.d.ts",
// }: Config = {}): Integration {
//   let env: Env;

//   let manager: AssetManager;
//   const cwd = process.cwd();

//   const regex = new RegExp(`${namespace}\\.((?:[\\w$]+(?:\\.[\\w$]+)*))`, "g");

//   function write_types() {
//     const type = make_type(namespace, manager.assets);
//     fs.writeFileSync(path.join(cwd, outFile), type);
//   }

//   return {
//     name: "@stack54/asset",
//     configResolved(conf) {
//       const root = path.join(cwd, conf.staticDir);

//       manager = new AssetManager(root);

//       manager.walk().make();

//       if (env.command == "serve") {
//         write_types();
//         manager.watch(write_types);
//       }
//     },
//     config(_, env_) {
//       env = env_;

//       const dev_plugin: Plugin = {
//         apply: "serve",
//         name: "stack54:assets-replace:dev",
//         // enforce: "pre",
//         transform: {
//           order: "pre",
//           handler(code, id) {
//             if (id.includes("node_modules")) return;

//             return code.replace(regex, (match, path) => {
//               const val = manager.mapping[path];
//               return val !== undefined ? JSON.stringify(val) : match;
//             });
//           },
//         },
//       };

//       const build_plugin: Plugin = {
//         apply: "build",
//         name: "stack54:assets-replace:build",
//         config() {
//           return {
//             define: Object.fromEntries(
//               Object.entries(manager.mapping).map(([k, v]) => [
//                 `${namespace}.${k}`,
//                 JSON.stringify(v),
//               ])
//             ),
//           };
//         },
//       };

//       return { vite: { plugins: [dev_plugin, build_plugin] } };
//     },
//   };
// }

import { call, createScope, each, spawn, Task } from "effection";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import type { Env, Integration } from "stack54/config";
import type { Plugin } from "vite";
import MagicString from "magic-string";

import vite_plugin from "./vite.js";
import { manager as service } from "./manager.js";
import { make_type } from "./utils.js";
import { Config } from "./types.js";

function string(str: string) {
  return JSON.stringify(str);
}

export default function plugin(config: Config = {}): Integration {
  let env: Env;

  const cwd = process.cwd();

  return {
    name: "@stack54/asset",
    // configResolved(conf) {
    //   manager = service(path.join(cwd, conf.staticDir));

    //   const write = function* () {
    //     const files = yield* manager.files();
    //     const [assets] = manager.assets(files);
    //     const type = make_type(namespace, assets);
    //     yield* call(() => fs.writeFile(path.join(cwd, outFile), type));
    //   };

    //   if (env.command == "serve") {
    //     scope
    //       .run(function* () {
    //         yield* manager.crawl();

    //         yield* write();

    //         const channel = yield* manager.watch();

    //         let task: Task<any> | undefined;

    //         for (const _ of yield* each(channel)) {
    //           if (task) yield* task.halt();

    //           task = yield* spawn(function* () {
    //             yield* manager.crawl();
    //             yield* write();
    //           });

    //           yield* each.next();
    //         }
    //       })
    //       .catch(console.log);
    //   }
    // },
    config(_, env_) {
      //   env = env_;

      //   const dev_plugin: Plugin = {
      //     apply: "serve",
      //     name: "stack54:asset:dev",
      //     transform: {
      //       order: "pre",
      //       handler(code, id) {
      //         if (id.includes("node_modules")) return;

      //         return scope.run(function* () {
      //           const files = yield* manager.files();
      //           const [, assets] = manager.assets(files);

      //           const s = new MagicString(code);

      //           s.replace(regex, (match, path) => {
      //             const value = assets.get(path);
      //             return value !== undefined ? string(value) : match;
      //           });

      //           return {
      //             code: s.toString(),
      //             map: s.generateMap({ hires: true }),
      //           };
      //         });
      //       },
      //     },
      //   };

      //   const build_plugin: Plugin = {
      //     apply: "build",
      //     name: "stack54:asset:build",
      //     config() {
      //       return scope.run(function* () {
      //         const files = yield* yield* manager.crawl();
      //         const [, map] = manager.assets(files);
      //         const assets = [...map.entries()];

      //         return {
      //           define: Object.fromEntries(
      //             assets.map(([k, v]) => [`${namespace}.${k}`, string(v)])
      //           ),
      //         };
      //       });
      //     },
      //   };

      // return { vite: { plugins: [dev_plugin, build_plugin] } };

      return { vite: { plugins: vite_plugin(config) } };
    },
  };
}
