import color from "kleur";
import * as vite from "vite";

import { call, suspend } from "effection";

import * as Config from "../config/index.js";
import { define, defineServerEnv, load } from "../env.js";
import { runConfigResolved, runConfigSetup } from "../integrations/hooks.js";
import { array } from "../utils/index.js";
import { makeVite } from "../utils/vite.js";
import { attachFullPath } from "./attach-full-path/index.js";
import { live_reload_plugin } from "./live-reload-plugin/index.js";
import { resolveInlineImportsPlugin } from "./resolve-inline-imports-plugin/index.js";
import { useLogger } from "../logger.js";

const cwd = process.cwd();

export function* dev() {
  const logger = useLogger();

  const start = performance.now();

  const inline_config = yield* call(Config.load(cwd));

  const user_config = Config.parse(inline_config);

  user_config.integrations = [
    ...(user_config.integrations ?? []),
    live_reload_plugin(),
  ];

  let merged_config = yield* call(
    runConfigSetup(user_config, { command: "serve" })
  );

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
    attachFullPath({ assetPrefix }),
  ];

  merged_config.vite.plugins = [
    ...(merged_config.vite.plugins ?? []),
    resolveInlineImportsPlugin(),
  ];

  const resolved_config = yield* call(
    Config.preprocess(merged_config, { cwd })
  );

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

  const shared_vite_config = makeVite(resolved_config, { mode: "dev" });

  const mode = process.env.NODE_ENV ?? "development";
  const env = load(resolved_config.env.dir ?? cwd, mode);

  const internal_vite_config: vite.InlineConfig = {
    define: define(env),
    build: { rollupOptions: { input: resolved_config.entry } },
  };

  const config: typeof merged_config = {
    ...resolved_config,
    vite: vite.mergeConfig(shared_vite_config, internal_vite_config),
  };

  yield* call(runConfigResolved(config));

  defineServerEnv(env);

  const server = yield* call(vite.createServer(config.vite));

  yield* call(server.listen());

  server.printUrls();

  const time = performance.now() - start;

  console.log();

  logger.info(`server ready in ${Math.round(time)} ${color.dim("ms")}`);

  logger.info("watching for changes...");

  try {
    yield* suspend();
  } finally {
    logger.info("stopping server...");
    yield* call(server.close());
    logger.info("stopped server");
  }
}
