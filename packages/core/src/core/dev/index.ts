import color from "kleur";
import * as vite from "vite";

import { Effect } from "effect";

import * as Config from "../config/index.js";
import { defineServerEnv, load } from "../env.js";
import { runConfigResolved, runConfigSetup } from "../integrations/hooks.js";
import { getSvelte, makeVite } from "../utils/vite.js";
import { hotReloadPlugin } from "../vite-plugins/hot-reload/index.js";
import { integrationsContainerPlugin } from "../vite-plugins/integrations/index.js";
import { attachFullPath } from "./preprocess/index.js";
import { resolveInlineImportsPlugin } from "./resolve-inline-imports/index.js";

const cwd = process.cwd();

export function dev() {
  return Effect.gen(function* () {
    const start = performance.now();

    const inline_config = yield* Effect.tryPromise(() => Config.load(cwd));

    const user_config = yield* Config.parse(inline_config);

    let merged_config = yield* Effect.promise(() => {
      return runConfigSetup(user_config);
    });

    let { assetPrefix } = merged_config.build;

    if (assetPrefix) {
      try {
        const path = new URL(assetPrefix).pathname;
        assetPrefix = path;
      } catch (error) {
        assetPrefix = "";
      }
    }

    const svelte_config = getSvelte(merged_config);

    merged_config.svelte = {
      ...svelte_config,
      preprocess: [
        ...svelte_config.preprocess,
        attachFullPath({ assetPrefix }),
      ],
    };

    // merged_config.integrations.push(liveReloadIntegration());

    const shared_vite_config = makeVite(merged_config, { mode: "dev" });

    const internal_vite_config: vite.InlineConfig = {
      build: { rollupOptions: { input: merged_config.entry } },
      plugins: [
        integrationsContainerPlugin(merged_config),
        resolveInlineImportsPlugin(),
        hotReloadPlugin(),
      ],
    };

    const config: typeof merged_config = {
      ...merged_config,
      vite: vite.mergeConfig(shared_vite_config, internal_vite_config),
    };

    const resolved_config = yield* Effect.promise(() => {
      return Config.preprocess(config, { cwd });
    });

    yield* Effect.promise(() => {
      return runConfigResolved(resolved_config);
    });

    const mode = process.env.NODE_ENV ?? "development";
    const env = load(resolved_config.env.dir ?? cwd, mode);

    defineServerEnv(env);

    const server = yield* Effect.tryPromise(() => {
      return vite.createServer(resolved_config.vite);
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
