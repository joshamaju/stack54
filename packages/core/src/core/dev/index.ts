import color from "kleur";
import * as vite from "vite";

import { call, suspend } from "effection";

import { Config } from "../config/index.js";
import { define, load } from "../env.js";
import {
  run_config_resolved,
  run_config_setup,
} from "../integrations/hooks.js";
import { use_logger } from "../logger.js";
import { clearScreen } from "../utils/console.js";
import { array } from "../utils/index.js";
import { make_vite_config } from "../utils/vite.js";
import { attach_full_path } from "./attach-full-path/index.js";
import { live_reload_plugin } from "./live-reload-plugin/index.js";
import { resolve_inline_imports_plugin } from "./resolve-inline-imports-plugin/index.js";

const command = "serve";
const cwd = process.cwd();

export function* dev(config_file?: string) {
  const logger = use_logger();

  const start = performance.now();

  const conf = new Config(cwd, config_file);

  const user_config = yield* call(() => conf.load());

  user_config.integrations = [
    ...(user_config.integrations ?? []),
    live_reload_plugin(),
  ];

  let merged_config = yield* call(run_config_setup(user_config, { command }));

  let { assetPrefix } = user_config.build;

  if (assetPrefix) {
    try {
      const path = new URL(assetPrefix).pathname;
      assetPrefix = path;
    } catch (error) {
      assetPrefix = "";
    }
  }

  merged_config.svelte.preprocess = [
    ...array(merged_config.svelte.preprocess ?? []),
    attach_full_path({ assetPrefix }),
  ];

  merged_config.vite.plugins = [
    ...(merged_config.vite.plugins ?? []),
    resolve_inline_imports_plugin(),
  ];

  const resolved_config = yield* call(() => conf.resolve(merged_config));

  /**
   * We turn this off because our internal preprocessors i.e attach-actual-path get svelte style tag content
   * as component markup, which is weird. Hopefully there's a fix for this.
   *
   * Take for example
   *
   * ```svelte
   * <script lang="ts">
   *   export let name: string;
   * </script>
   *
   * <p>{name}</p>
   *
   * <style>
   *   p {
   *     color: red;
   *   }
   * </style>
   * ```
   *
   * We get the processed (minified) content of the style tag instead of the `p` tag. So the
   * following preprocessor markup hook gets the style tag content instead.
   *
   * ```ts
   * const my_preprocessor = {
   *   name: "my-preprocessor",
   *   markup({ content }) {
   *     // content is the style tag contents
   *   }
   * };
   * ```
   */
  resolved_config.svelte.emitCss = false;

  const mode = process.env.NODE_ENV ?? "development";

  const shared_vite_config = make_vite_config(resolved_config, {
    mode,
    command,
  });

  const env = load(resolved_config.env.dir ?? cwd, mode);

  const internal_vite_config: vite.InlineConfig = {
    define: define(env),
    build: { rollupOptions: { input: resolved_config.entry } },
  };

  const config: typeof merged_config = {
    ...resolved_config,
    vite: vite.mergeConfig(shared_vite_config, internal_vite_config),
  };

  yield* call(run_config_resolved(config));

  const server = yield* call(vite.createServer(config.vite));

  yield* call(server.listen());

  server.printUrls();
  server.bindCLIShortcuts({ print: true });

  const time = performance.now() - start;

  console.log();

  logger.info(`server ready in ${Math.round(time)} ${color.dim("ms")}`);

  logger.info("watching for changes...");

  try {
    yield* suspend();
  } finally {
    clearScreen();
    logger.info("stopping server...");
    yield* call(server.close());
    logger.info("stopped server");
  }
}
