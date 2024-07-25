import * as fs from "node:fs/promises";
import * as path from "node:path";

import fse from "fs-extra";

import type { Plugin } from "vite";
import * as vite from "vite";

import { Effect } from "effect";

import type { ResolvedConfig } from "../../config/index.js";
import { define, Env } from "../../env.js";
import type { Output } from "../types.js";
import type { PreparedFacade } from "./facade.js";
import * as Facade from "./facade.js";

const VITE_HTML_PLACEHOLDER = "<div data-obfuscation-placeholder></div>";

const obfuscate: Plugin = {
  name: "plugin-obfuscate",
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
  name: "plugin-deobfuscate",
  transformIndexHtml(html) {
    return html.replace(`${VITE_HTML_PLACEHOLDER}`, "");
  },
};

export async function buildViews({
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

  Effect.gen(function* (_) {
    yield* _(Effect.promise(() => fse.remove(root_dir)));
    yield* _(Effect.promise(() => fs.mkdir(root_dir)));

    let facades = new Map<string, PreparedFacade>();

    Effect.forEach(config.views, (view) => {
      return Effect.gen(function* (_) {
        const code = yield* _(Effect.promise(() => fs.readFile(view, "utf-8")));

        const prepared = Facade.prepare(code);
        const facade = Facade.make(view, generated_dir);

        yield* _(
          Effect.promise(() =>
            fs.mkdir(path.dirname(facade), { recursive: true })
          )
        );

        yield* _(Effect.promise(() => fs.writeFile(facade, prepared.code)));

        facades.set(facade, prepared);
      });
    });
  });

  await fse.remove(root_dir);
  await fs.mkdir(root_dir);

  let facades = new Map<string, PreparedFacade>();

  for (const view of config.views) {
    const code = await fs.readFile(view, "utf-8");

    const prepared = Facade.prepare(code);
    const facade = Facade.make(view, generated_dir);

    await fs.mkdir(path.dirname(facade), { recursive: true });
    await fs.writeFile(facade, prepared.code);

    facades.set(facade, prepared);
  }

  const resolve: Plugin = {
    name: "facade-resolver",
    async resolveId(source, importer) {
      if (importer && facades.has(importer)) {
        const original = importer.replace(generated_dir, "");
        const file = path.resolve(path.dirname(original), source);
        if (await fse.exists(file)) return file;
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
      // minify: config.build.minify,
      rollupOptions: { input: [...facades.keys()] },
    },
  };

  await vite.build(vite.mergeConfig(config.vite, inline_config));

  let modules = new Map<string, Output>();

  for (const [facade, prepared] of facades) {
    const view = path.join(build_dir, facade.replace(cwd, ""));
    const html = await fs.readFile(view, "utf-8");
    const code = Facade.reconstruct({ ...prepared, code: html });
    const original = view.replace(path.join(cwd, build, generated), "");
    const { dir, name } = path.parse(original);
    const file = path.join(dir, `${name}.svelte`);
    modules.set(file, { code, file });
  }

  await fse.move(
    path.join(build_dir, config.build.assetsDir),
    path.join(outDir, "client", config.build.assetsDir)
  );

  await fse.remove(root_dir);

  return modules;
}
