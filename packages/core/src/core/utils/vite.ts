import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import * as vite from "vite";

import { ResolvedConfig } from "../config/index.js";
import { arraify } from "./index.js";
import { createViteLogger } from "../logger.js";

type CreateViteOptions = {
  mode: "dev" | "build" | string;
  // will be undefined when using `getViteConfig`
  command?: "dev" | "build";
};

const defaultPreprocessors = [vitePreprocess()];

export function getSvelte(config: ResolvedConfig) {
  const svelte_config = config.svelte;

  const preprocess = svelte_config.preprocess
    ? arraify(svelte_config.preprocess)
    : [];

  const preprocessors = [...defaultPreprocessors, ...preprocess];

  return { ...svelte_config, preprocess: preprocessors };
}

export function makeVite(config: ResolvedConfig, { mode }: CreateViteOptions) {
  const inline_config: vite.InlineConfig = {
    appType: "custom",
    configFile: false,
    clearScreen: false,
    envDir: config.env.dir,
    publicDir: config.staticDir,
    base: config.build.assetPrefix,
    customLogger: createViteLogger(),
    envPrefix: config.env.publicPrefix,
    plugins: [svelte(getSvelte(config)) as vite.PluginOption],
    build: {
      copyPublicDir: false,
      assetsDir: config.build.assetsDir,
      minify: config.build.minify ?? config.vite.build?.minify ?? true,
    },
    server: {
      watch: {
        // Prevent watching during the build to speed it up
        ignored: mode === "build" ? ["**"] : undefined,
      },
    },
  };

  return vite.mergeConfig(config.vite, inline_config);
}
