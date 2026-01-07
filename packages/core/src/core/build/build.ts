import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { InlineConfig, Plugin } from "vite";
import * as vite from "vite";

import { call, ensure, useScope } from "effection";
import picomatch from "picomatch";

import { ResolvedConfig } from "../config/index.js";
import { define, Env, partition } from "../env.js";
import { make_vite_logger } from "../logger.js";
import { Manifest } from "../types.js";
import { parse_id } from "../utils/view.js";
import { compile } from "./compiler.js";
import { copy } from "../utils/filesystem.js";

type Opts = { config: ResolvedConfig; outDir: string; env: Env; cwd: string };

export function* builder({ cwd, env, config, outDir }: Opts) {
  const dir = path.join(cwd, ".stack54");

  const scope = yield* useScope();

  yield* call(() => fs.rm(dir, { recursive: true, force: true }));

  yield* call(() => fs.mkdir(dir));

  yield* ensure(function* () {
    yield* call(() => fs.rm(dir, { recursive: true, force: true }));
  });

  const { public: public_ } = partition(env, config.env.publicPrefix);

  const matcher = picomatch(config.views, { cwd, contains: true });

  const manifests: Manifest = {};

  const plugin: Plugin = {
    name: "stack54:compiler",
    buildEnd(error) {
      if (error) {
        console.log();
        console.log(error);
      }
    },
    transform: {
      order: "pre",
      async handler(code, id) {
        const { filename } = parse_id(id);

        if (filename.endsWith(".svelte") && matcher(filename)) {
          return scope.run(function* () {
            const args = { dir, code, config, outDir, filename, env: public_ };
            const result = yield* compile(args);
            manifests[filename] = result?.manifest ?? [];
            return result?.code;
          });
        }
      },
    },
  };

  const env_define = define(env);

  const vite_logger = make_vite_logger("server");

  const inline_config: InlineConfig = {
    plugins: [plugin],
    define: env_define,
    mode: "production",
    customLogger: vite_logger,
    build: {
      ssr: true,
      ssrEmitAssets: true,
      minify: config.build.minify,
      outDir: path.join(outDir, "server"),
      rollupOptions: { input: config.entry },
    },
  };

  yield* call(() => vite.build(vite.mergeConfig(config.vite, inline_config)));

  if (config.build.copyStaticDir) {
    const dir = path.join(cwd, config.staticDir);

    try {
      yield* call(() => copy(dir, path.join(outDir, config.build.assetsDir)));
    } catch (error) {
      console.log(error);
    }
  }

  return manifests;
}
