import * as fs from "node:fs/promises";
import * as path from "node:path";

import fse from "fs-extra";

import type { Plugin } from "vite";
import * as vite from "vite";

import { Effect } from "effect";

import type { ResolvedConfig } from "../config/index.js";
import { define, Env } from "../env.js";
import {
  runHtmlPostTransform,
  runHtmlPreTransform,
} from "../integrations/hooks.js";
import * as Facade from "./facade.js";
import type { Output } from "./types.js";

const VITE_HTML_PLACEHOLDER = "<div data-obfuscation-placeholder></div>";

const obfuscate: Plugin = {
  name: "view-obfuscator",
  /**
   * we need to execute this before any vite html parser sees it and throws an error because of the
   * svelte script at the beginning of the markup, to trick it into accepting the markup as valid HTML
   */
  transformIndexHtml: {
    order: "pre",
    handler(html) {
      return `${VITE_HTML_PLACEHOLDER}\n${html}`;
    },
  },
};

const deobfuscate: Plugin = {
  enforce: "post",
  name: "view-deobfuscator",
  transformIndexHtml(html) {
    return html.replace(`${VITE_HTML_PLACEHOLDER}`, "");
  },
};

export function buildViews({
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

  const program = Effect.gen(function* () {
    yield* Effect.tryPromise(() => fse.remove(root_dir));

    yield* Effect.tryPromise(() => fs.mkdir(root_dir));

    const facade_keypairs = yield* Effect.forEach(
      config.views,
      (view) => {
        return Effect.gen(function* () {
          const code = yield* Effect.tryPromise(() => {
            return fs.readFile(view, "utf-8");
          });

          const transformed = yield* Effect.tryPromise(() => {
            return runHtmlPreTransform(config, { code, filename: view });
          });

          const prepared = yield* Effect.tryPromise(() => {
            return Facade.prepare(transformed, view, config.svelte);
          });

          const facade = Facade.make(view, generated_dir);

          yield* Effect.tryPromise(() => {
            return fs.mkdir(path.dirname(facade), { recursive: true });
          });

          yield* Effect.tryPromise(() => {
            return fs.writeFile(facade, prepared.code);
          });

          return [facade, prepared] as const;
        });
      },
      { concurrency: "unbounded" }
    );

    const facades = new Map(facade_keypairs);

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

    const inline_config: vite.InlineConfig = {
      logLevel: "silent",
      define: env_define,
      mode: "production",
      plugins: [resolve, obfuscate, deobfuscate],
      build: {
        ssr: false,
        outDir: build_dir,
        rollupOptions: { input: [...facades.keys()] },
      },
    };

    yield* Effect.tryPromise(() => {
      return vite.build(vite.mergeConfig(config.vite, inline_config));
    });

    const modules = yield* Effect.forEach(
      facades,
      ([facade, prepared]) => {
        return Effect.gen(function* () {
          const view = path.join(build_dir, facade.replace(cwd, ""));

          const html = yield* Effect.tryPromise(() => {
            return fs.readFile(view, "utf-8");
          });

          const code = Facade.reconstruct({ ...prepared, code: html });
          const original = view.replace(path.join(cwd, build, generated), "");

          const { dir, name } = path.parse(original);
          const file = path.join(dir, `${name}.svelte`);

          const transformed = yield* Effect.tryPromise(() => {
            return runHtmlPostTransform(config, { code, filename: file });
          });

          return [file, { file, code: transformed } as Output] as const;
        });
      },
      { concurrency: "unbounded" }
    );

    const assets = path.join(build_dir, config.build.assetsDir);

    const has_assets = yield* Effect.tryPromise(() => fse.exists(assets));

    if (has_assets) {
      yield* Effect.tryPromise(() => {
        return fse.move(assets, path.join(outDir, config.build.assetsDir));
      });
    }

    return new Map(modules);
  });

  return program.pipe(
    Effect.ensuring(Effect.promise(() => fse.remove(root_dir)))
  );
}
