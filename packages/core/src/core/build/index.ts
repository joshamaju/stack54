import * as path from "node:path";

import fs from "fs-extra";

import { Effect } from "effect";

import * as Config from "../config/index.js";
import { defineServerEnv, load, partition } from "../env.js";
import {
  runBuildEnd,
  runBuildStart,
  runConfigResolved,
  runConfigSetup,
} from "../integrations/hooks.js";
import { makeVite } from "../utils/vite.js";
import { buildServer } from "./server.js";
import { buildViews } from "./view.js";

import { makeViteLogger } from "../logger.js";
import {
  islandIntegration,
  islandPlugin,
} from "../vite-plugins/island/index.js";

const cwd = process.cwd();

export function build() {
  return Effect.gen(function* () {
    const inline_config = yield* Effect.tryPromise(() => Config.load(cwd));

    const user_config = yield* Config.parse(inline_config);

    user_config.integrations.push(islandIntegration());

    let merged_config = yield* Effect.promise(() => {
      return runConfigSetup(user_config, { command: "build" });
    });

    const resolved_config = yield* Effect.tryPromise(() => {
      return Config.preprocess(merged_config, { cwd });
    });

    const logger = yield* makeViteLogger();

    const shared_vite_config = makeVite(resolved_config, {
      logger,
      mode: "build",
    });

    const config = { ...resolved_config, vite: shared_vite_config };

    yield* Effect.tryPromise(() => runConfigResolved(config));

    const outDir = path.join(cwd, config.build.outDir);

    const mode = process.env.NODE_ENV ?? "production";

    const env = load(config.env.dir ?? cwd, mode);
    const { public: public_ } = partition(env, config.env.publicPrefix);

    yield* Effect.tryPromise(() => fs.remove(outDir));

    yield* Effect.promise(() => runBuildStart(config));

    yield* Effect.log("building views...");

    const opts = { cwd, outDir, config: config, env: public_ };
    const views = yield* buildViews(opts);

    yield* Effect.log("building server...");

    defineServerEnv(env);

    yield* Effect.promise(() => {
      return buildServer(views, { env, outDir, config });
    });

    yield* Effect.promise(() => runBuildEnd(config));

    yield* Effect.log("✔︎ build done");
  });
}
