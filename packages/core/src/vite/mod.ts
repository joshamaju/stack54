import fs from "fs-extra";

import { globSync as glob } from "glob";

import color from "kleur";

import type { Plugin, ResolvedConfig } from "vite";

import { PreprocessorGroup } from "svelte/compiler";
import type { Options as SvelteOptions } from "@sveltejs/vite-plugin-svelte";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";

import { mdsvex } from "mdsvex";

import * as Option from "effect/Option";
import * as RA from "effect/ReadonlyArray";

import { parse as parse_config } from "../core/config/mod.js";
import type { UserConfig } from "../core/config/options.js";

// Plugins
import { plugin_buildHTML } from "./plugin-build-html/mod.js";
import { plugin_devServer } from "./plugin-dev-server/mod.js";
import { plugin_env } from "./plugin-env/mod.js";
import { plugin_previewServer } from "./plugin-preview-server/mod.js";
import { plugin_typedTemplate } from "./plugin-typed-views/mod.js";

// Preprocessors
import { attach_full_path } from "../core/preprocess-html/mod.js";

const pattern = color.cyan("src/entry.(js|ts)");

const noDefaultServerEntryMsg = `Couldn't find the default ${pattern} file. Please make sure to specify one in the config if you wish to use a different file`;

const noServerEntryMsg = (file: string) =>
  `Couldn't find entry file ${file}. Please make sure the file exists.`;

const cwd = process.cwd();

const markdownPreprocessor = mdsvex() as PreprocessorGroup;

const defaultPreprocessors = [markdownPreprocessor, vitePreprocess()];

export default function fullstack(userConfig?: UserConfig) {
  const root = ".stack54";

  const configResult = parse_config(userConfig ?? {});

  if (!configResult.success) {
    const { fieldErrors } = configResult.error.flatten();

    const errors: string[] = [];

    for (let k in fieldErrors) {
      const error = fieldErrors[k as keyof typeof fieldErrors];

      if (error) {
        errors.push(`${color.gray(`- ${k}:`)} ${color.red(error.join(", "))}`);
      }
    }

    console.log(color.bold(color.yellow("Config error")));
    console.log(errors.join("\n"));
    console.log(); // new line

    process.exit(1);
  }

  const { compilerOptions, ...config } = configResult.data;

  const preprocessors = config.preprocess
    ? Array.isArray(config.preprocess)
      ? [...config.preprocess, ...defaultPreprocessors]
      : [config.preprocess, ...defaultPreprocessors]
    : defaultPreprocessors;

  const serverEntry = glob(config.serverEntry, { cwd });

  const entry = RA.head(serverEntry);

  if (Option.isNone(entry)) {
    const msg =
      userConfig?.serverEntry != undefined
        ? noServerEntryMsg(userConfig.serverEntry)
        : noDefaultServerEntryMsg;

    console.log(color.red("No server entry file found"));
    console.log(color.yellow(msg));
    console.log(); // new line

    process.exit(1);
  }

  const resolved_config = { ...config, serverEntry: entry.value };

  let resolved_vite_config: ResolvedConfig;

  fs.ensureDirSync(root);
  fs.emptyDirSync(root);

  const setup: Plugin = {
    name: "mpa:setup",
    configResolved(config) {
      resolved_vite_config = config;
    },
    config() {
      return {
        appType: "custom",
        optimizeDeps: {
          exclude: ["mpa", "$env"],
        },
        server: {
          watch: {
            ignored: [root],
          },
        },
        build: {
          ssr: true,
          ssrEmitAssets: true,
          copyPublicDir: false,
          rollupOptions: {
            input: { index: entry.value },
          },
        },
      };
    },
  };

  /**
   * **Attaches full filesystem path to HTML assets**
   *
   * Given there's no apparent connection between a resource in a template
   * to its actual location in the filesystem, all vite sees is a request for /style.css
   * but vite has no idea where that file is, is it located at /project/src/views/home/style.css or
   * /project/src/views/pages/home/style.css etc. So we need to hard link stylesheet and script tag resources
   * during development to enable vite find and process them properly at request time.
   *
   * So `<link rel="stylesheet" href="./style.css" />` becomes
   * `<link rel="stylesheet" href="[project directory]/src/views/home/style.css" />`
   *
   * This is unnecessary during build, because vite can find relative imports or file reference.
   *
   * We proxy the resolved vite config to enable the preprocessor know if we're in development or production mode.
   * Because there's no guarantee that the resolved vite config will be available at this point, which means we can
   * conditionally include the preprocessor based on the mode. But we know it will definitely be available before
   * the preprocessor executes
   */
  const configProxy = new Proxy({} as ResolvedConfig, {
    get(_, p) {
      return resolved_vite_config[p as keyof typeof resolved_vite_config];
    },
  });

  const svelteOptions: SvelteOptions = {
    // emitCss: false,
    extensions: config.extensions,
    preprocess: [...preprocessors, attach_full_path(configProxy)],
    compilerOptions: {
      ...compilerOptions,
      hydratable: compilerOptions?.hydratable ?? true,
    },
  };

  return [
    setup,
    svelte(svelteOptions),
    plugin_previewServer(),
    plugin_env({ cwd, outDir: root }),
    plugin_devServer(resolved_config),
    plugin_buildHTML({ cwd, outDir: root }),
    plugin_typedTemplate(config, { cwd, outDir: root }),
  ];
}
