import color from "kleur";
import * as vite from "vite";

import { Effect } from "effect";

import * as Config from "../config/index.js";
import { define, defineServerEnv, load } from "../env.js";
import { runConfigResolved, runConfigSetup } from "../integrations/hooks.js";
import { array } from "../utils/index.js";
import { makeVite } from "../utils/vite.js";
import { attachFullPath } from "./attach-full-path/index.js";
import { hotReloadPlugin } from "./hot-reload-plugin/index.js";
import { resolveInlineImportsPlugin } from "./resolve-inline-imports-plugin/index.js";

const cwd = process.cwd();

export function dev() {
  return Effect.gen(function* () {
    const start = performance.now();

    const inline_config = yield* Effect.tryPromise(() => Config.load(cwd));

    const user_config = yield* Config.parse(inline_config);

    let merged_config = yield* Effect.tryPromise(() => {
      return runConfigSetup(user_config, { command: "serve" });
    });

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

    merged_config.integrations = [
      ...(merged_config.integrations ?? []),
      hotReloadPlugin(),
    ];

    const resolved_config = yield* Effect.promise(() => {
      return Config.preprocess(merged_config, { cwd });
    });

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

    yield* Effect.promise(() => runConfigResolved(config));

    defineServerEnv(env);

    const server = yield* Effect.tryPromise(() => {
      return vite.createServer(config.vite);
    });

    yield* Effect.promise(() => server.listen());

    console.log();

    server.printUrls();

    const time = performance.now() - start;

    console.log();

    yield* Effect.log(`server ready in ${Math.round(time)} ${color.dim("ms")}`);

    yield* Effect.log(
      `logs for your project will appear below. ${color.dim(
        "Press Ctrl+C to exit."
      )}`
    );

    yield* Effect.log("watching for changes...");

    return yield* Effect.addFinalizer(() => {
      return Effect.gen(function* () {
        yield* Effect.log("stopping server...");
        yield* Effect.promise(() => server.close());
        yield* Effect.log("stopped server");
      });
    });
  });
}
