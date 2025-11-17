import watcher from "@parcel/watcher";
import { snakecase } from "stringcase";
import { call, createSignal, resource, Signal, spawn, Task } from "effection";
import * as path from "node:path";
import op from "object-path";

import { Assets } from "./types.js";
import { walk } from "./utils.js";

function format(str: string) {
  return snakecase(str);
}

// export class AssetManager {
//   assets: Assets = {};
//   mapping: Entry = {};
//   files: string[] = [];

//   constructor(private dir: string) {}

//   walk() {
//     this.files = walk(this.dir);
//     return this;
//   }

//   make() {
//     const files = this.files;
//     const assets: Assets = {};
//     const counter = new Map<string, number>();
//     const mapping: Record<string, string> = {};

//     const _ = files.map((file) => {
//       const { dir, name, ext } = path.parse(file);
//       const key = [dir, name].filter(Boolean).join("_");
//       const count = counter.get(key) ?? 0;
//       counter.set(key, count + 1);
//       return { key, file, dir, name, ext };
//     });

//     for (const { key, file, dir, name, ext } of _) {
//       const count = counter.get(key);
//       const filename = `/${file}`;

//       if (count !== undefined && count > 1) {
//         const dot_path = [
//           ...dir.split(path.sep).map(format),
//           `${format(name)}${ext}`,
//         ]
//           .filter(Boolean)
//           .join(".");

//         mapping[dot_path] = filename;
//         op.set(assets, dot_path, filename);
//       } else {
//         const dot_path = [...dir.split(path.sep), name]
//           .map(format)
//           .filter(Boolean)
//           .join(".");

//         mapping[dot_path] = filename;
//         op.set(assets, dot_path, filename);
//       }
//     }

//     this.assets = assets;
//     this.mapping = mapping;

//     return this;
//   }

//   async watch(callback: () => void) {
//     const subscription = await watcher.subscribe(this.dir, (err, events) => {
//       if (err) throw err;
//       this.walk().make();
//       callback();
//     });

//     // subscription.unsubscribe()
//   }
// }

export function manager(dir: string) {
  let files: string[] | Task<string[]> = [];

  return {
    *crawl() {
      files = yield* spawn(() => call(() => walk(dir)));
      return files;
    },
    *files() {
      files = Array.isArray(files) ? files : yield* files;
      return files;
    },
    assets(files: string[]) {
      const assets: Assets = {};
      const map = new Map<string, string>();
      const counter = new Map<string, number>();

      const _ = files.map((file) => {
        const { dir, name, ext } = path.parse(file);
        const key = [dir, name].filter(Boolean).join("_");
        const count = counter.get(key) ?? 0;
        counter.set(key, count + 1);
        return { key, file, dir, name, ext };
      });

      for (const { key, file, dir, name, ext } of _) {
        const filename = `/${file}`;
        const count = counter.get(key);

        let paths: string[];

        /**
         * This groups files with the same name but different extensions
         * into an object. E.g.
         * assets/image.png
         * assets/image.css
         * 
         * becomes
         * {
         *   image: {
         *     png: '/assets/image.png',
         *     css: '/assets/image.css'
         *   }
         * }
         * 
         * while assets/style.css becomes
         * {
         *   style: '/assets/style.css'
         * }
         * 
         * so the user can access the files as
         * Assets.image.png
         * Assets.image.css
         * Assets.style
         */
        if (count !== undefined && count > 1) {
          paths = [...dir.split(path.sep).map(format), `${format(name)}${ext}`];
        } else {
          paths = [...dir.split(path.sep), name].map(format);
        }

        const dot_path = paths.filter(Boolean).join(".");

        map.set(dot_path, filename);
        op.set(assets, dot_path, filename);
      }

      return [assets, map] as const;
    },
    watch() {
      return resource<Signal<void, void>>(function* (provide) {
        let subscription: watcher.AsyncSubscription | undefined;

        const channel = createSignal<void, void>();

        try {
          subscription = yield* call(() => {
            return watcher.subscribe(dir, (err) => {
              if (err) throw err;
              channel.send();
            });
          });

          yield* provide(channel);
        } finally {
          channel.close();

          if (subscription) {
            yield* call(() => subscription?.unsubscribe());
          }
        }
      });
    },
  };
}
