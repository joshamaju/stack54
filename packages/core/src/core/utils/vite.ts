import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import * as vite from "vite";

import { ResolvedConfig } from "../config/index.js";
import { array } from "./index.js";
import { integrations_container_plugin } from "../vite-plugins/integrations/index.js";

type CreateViteOptions = {
  mode: "dev" | "build" | string;
  // will be undefined when using `getViteConfig`
  command?: "dev" | "build";
  logger?: vite.Logger;
};

const default_preprocessors = [vitePreprocess()];

export function get_svelte_config(config: ResolvedConfig) {
  const svelte_config = config.svelte;

  const preprocess = svelte_config.preprocess
    ? array(svelte_config.preprocess)
    : [];

  const preprocessors = [...default_preprocessors, ...preprocess];

  return { ...svelte_config, preprocess: preprocessors };
}

export function make_vite_config(
  config: ResolvedConfig,
  { mode, logger }: CreateViteOptions
) {
  const inline_config: vite.InlineConfig = {
    appType: "custom",
    configFile: false,
    clearScreen: false,
    customLogger: logger,
    envDir: config.env.dir,
    publicDir: config.staticDir,
    base: config.build.assetPrefix,
    envPrefix: config.env.publicPrefix,
    plugins: [
      svelte(config.svelte) as vite.PluginOption,
      integrations_container_plugin(config),
    ],
    build: {
      copyPublicDir: false,
      assetsDir: config.build.assetsDir,
      minify: config.build.minify ?? config.vite.build?.minify,
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
