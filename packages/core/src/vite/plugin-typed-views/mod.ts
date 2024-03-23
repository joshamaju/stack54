import { globSync as glob, GlobOptions } from "glob";
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

import { Config } from "../../core/config/options.js";
import { types_template } from "../../core/sync/write-views.js";
import { is_view } from "../utils/template.js";

let cache = new Set<string>();

const write = (
  templates: string[],
  config: Config,
  { cwd, file, outDir }: { outDir: string; file: string; cwd: string }
) => {
  fs.writeFileSync(file, types_template(templates, config, { cwd, outDir }));
};

export function plugin_typedTemplate(
  config: Config,
  {
    cwd,
    outDir,
  }: {
    cwd: string;
    outDir: string;
  }
): Plugin {
  const { ignore } = config.typescript.views;
  const outFile = path.join(outDir, "views.d.ts");

  const conf = { cwd, outDir, file: outFile };

  return {
    name: "mpa:typed-template",
    config() {
      return {
        server: {
          watch: {
            ignored: [outFile],
          },
        },
      };
    },
    buildStart() {
      const files = glob("**/*.svelte", {
        cwd,
        ignore,
        absolute: true,
        root: config.directories.templates,
      });

      write(files, config, conf);

      cache = new Set(files);
    },
    configureServer(server) {
      return () => {
        server.watcher.on("all", (e, file) => {
          if (!is_view(file)) return;

          if (e == "unlink") {
            cache.delete(file);
          }

          if (e == "add") {
            cache.add(file);
          }

          write([...cache], config, conf);
        });
      };
    },
  };
}
