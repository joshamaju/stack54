import * as fs from "node:fs";
import * as path from "node:path";

import fse from "fs-extra";

import type { Plugin } from "vite";
import * as vite from "vite";

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

  fse.removeSync(root_dir);
  fs.mkdirSync(root_dir);

  let facades = new Map<string, PreparedFacade>();

  for (const view of config.views) {
    const code = fs.readFileSync(view, "utf-8");

    const prepared = Facade.prepare(code);
    const facade = Facade.make(view, generated_dir);

    fs.mkdirSync(path.dirname(facade), { recursive: true });
    fs.writeFileSync(facade, prepared.code);

    facades.set(facade, prepared);
  }

  const resolve: Plugin = {
    name: "facade-resolver",
    resolveId(source, importer) {
      if (importer && facades.has(importer)) {
        const original = importer.replace(generated_dir, "");
        const file = path.resolve(path.dirname(original), source);
        if (fs.existsSync(file)) return file;
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
    const html = fs.readFileSync(view, "utf-8");
    const code = Facade.reconstruct({ ...prepared, code: html });
    const original = view.replace(path.join(cwd, build, generated), "");
    const { dir, name } = path.parse(original);
    const file = path.join(dir, `${name}.svelte`);
    modules.set(file, { code, file });
  }

  fse.moveSync(
    path.join(build_dir, config.build.assetsDir),
    path.join(outDir, "client", config.build.assetsDir)
  );

  fse.removeSync(root_dir);

  return modules;
}
