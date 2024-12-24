import * as fs from "node:fs/promises";
import * as path from "node:path";

import fse from "fs-extra";

import type { Processed } from "svelte/compiler";
import * as compiler from "svelte/compiler";
import type { Plugin } from "vite";
import * as vite from "vite";

import { all, call } from "effection";

import type { ResolvedConfig } from "../config/index.js";
import { define, Env } from "../env.js";
import {
  runHtmlPostTransform,
  runHtmlPreTransform,
} from "../integrations/hooks.js";
import * as Facade from "./facade.js";
import type { Output } from "./types.js";
import { makeViteLogger, useLogger } from "../logger.js";

export function* buildViews({
  env,
  cwd,
  outDir,
  config,
}: {
  env: Env;
  cwd: string;
  outDir: string;
  config: ResolvedConfig;
}) {
  const root = ".facades";
  const build = path.join(root, "build");
  const generated = path.join(root, "generated");

  const root_dir = path.join(cwd, root);
  const build_dir = path.join(cwd, build);
  const generated_dir = path.join(cwd, generated);

  const preprocessors = config.svelte.preprocess ?? [];

  const logger = useLogger();

  yield* call(fse.remove(root_dir));

  yield* call(fs.mkdir(root_dir));

  const facade_keypairs = yield* all(
    config.views.map((filename) => {
      return call(function* () {
        const code = yield* call(fs.readFile(filename, "utf-8"));

        const processed: Processed = yield* call(
          compiler.preprocess(code, preprocessors, { filename })
        );

        const transformed =
          config.integrations.length <= 0
            ? processed.code
            : yield* call(
                runHtmlPreTransform(config, {
                  code: processed.code,
                  filename,
                })
              );

        const prepared = Facade.prepare(transformed, filename);

        // skip views with no client assets to process
        if (prepared.moves.length <= 0) {
          return;
        }

        const facade = Facade.make(filename, generated_dir);

        yield* call(fs.mkdir(path.dirname(facade), { recursive: true }));

        yield* call(fs.writeFile(facade, prepared.code));

        return [facade, prepared] as const;
      });
    })
  );

  // @ts-ignore build gets the filtered type wrong
  const facades = new Map(facade_keypairs.filter((_) => _ !== undefined));

  if (facades.size > 0) {
    const resolve: Plugin = {
      name: "facade-resolver",
      async resolveId(source, importer) {
        if (importer) {
          const [importer_] = importer.split("?");

          /**
           * resolves imports (including import aliases) inside inline script and modules script tags
           * i.e
           * <script type="module">
           * import module from '@/aliased/module'
           * import module from './file/path'
           * import module form 'installed/node-module'
           * </script>
           */
          if (facades.has(importer_)) {
            // reconstruct the original svelte file name from the html facade
            const original = importer_.replace(generated_dir, "");

            const { dir, name } = path.parse(original);
            const view = path.join(dir, `${name}.svelte`);

            const resolved = await this.resolve(source, view);

            if (resolved) return resolved;

            const file = path.resolve(path.dirname(original), source);
            if (await fse.exists(file)) return file;
          }
        }
      },
    };

    const env_define = define(env);

    const vite_logger = makeViteLogger("client");

    const inline_config: vite.InlineConfig = {
      logLevel: "silent",
      define: env_define,
      mode: "production",
      plugins: [resolve],
      customLogger: vite_logger,
      build: {
        ssr: false,
        outDir: build_dir,
        rollupOptions: { input: [...facades.keys()] },
      },
    };

    yield* call(vite.build(vite.mergeConfig(config.vite, inline_config)));
  } else {
    logger.warn("No views to build");
  }

  const modules = yield* all(
    [...facades.entries()].map(([facade, prepared]) => {
      return call(function* () {
        const view = path.join(build_dir, facade.replace(cwd, ""));

        const html = yield* call(fs.readFile(view, "utf-8"));

        const code = Facade.reconstruct({ ...prepared, code: html });
        const original = view.replace(path.join(cwd, build, generated), "");

        const { dir, name } = path.parse(original);
        const file = path.join(dir, `${name}${prepared.extension}`);

        const transformed =
          config.integrations.length <= 0
            ? code
            : yield* call(
                runHtmlPostTransform(config, { code, filename: file })
              );

        return [file, { file, code: transformed } as Output] as const;
      });
    })
  );

  const assets = path.join(build_dir, config.build.assetsDir);

  const has_assets = yield* call(fse.exists(assets));

  if (has_assets) {
    yield* call(fse.move(assets, path.join(outDir, config.build.assetsDir)));
  }

  try {
  } finally {
    yield* call(fse.remove(root_dir));
  }

  return new Map(modules);
}
