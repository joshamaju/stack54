import color from "kleur";
import * as vite from "vite";

import { Effect } from "effect";

import * as Config from "../config/index.js";
import { defineServerEnv, load } from "../env.js";
import { runConfigResolved, runConfigSetup } from "../integrations/hooks.js";
import { arraify } from "../utils/index.js";
import { makeVite } from "../utils/vite.js";
import { hotReloadPlugin } from "../vite-plugin-hot-reload/index.js";
import { integrationsPlugin } from "../vite-plugin-integrations/index.js";
import { attachFullPath } from "./preprocess/index.js";

const cwd = process.cwd();

export function dev() {
  return Effect.gen(function* () {
    const start = performance.now();

    const inline_config = yield* Effect.tryPromise(() => Config.load(cwd));

    const user_config = yield* Config.parse(inline_config);

    let merged_config = yield* Effect.promise(() => {
      return runConfigSetup(user_config);
    });

    const svelte_config = merged_config.svelte;

    const preprocess = svelte_config.preprocess
      ? arraify(svelte_config.preprocess)
      : [];

    let { assetPrefix } = merged_config.build;

    if (assetPrefix) {
      try {
        const path = new URL(assetPrefix).pathname;
        assetPrefix = path;
      } catch (error) {
        assetPrefix = "";
      }
    }

    const preprocessors = [...preprocess, attachFullPath({ assetPrefix })];

    const shared_vite_config = makeVite(
      {
        ...merged_config,
        svelte: {
          ...merged_config.svelte,
          preprocess: preprocessors,
        },
      },
      { mode: "dev" }
    );

    const internal_vite_config: vite.InlineConfig = {
      build: { rollupOptions: { input: merged_config.entry } },
      plugins: [integrationsPlugin(user_config), hotReloadPlugin()],
    };

    const config = {
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

    yield* Effect.log(`load .env.${mode}`);

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
