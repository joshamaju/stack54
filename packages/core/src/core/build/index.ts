import * as path from "node:path";

import fs from "fs-extra";

import { Effect } from "effect";

import * as Config from "../config/index.js";
import { defineServerEnv, load, partition } from "../env.js";
import { runConfigResolved, runConfigSetup } from "../integrations/hooks.js";
import { makeVite } from "../utils/vite.js";
import { buildServer } from "./server.js";
import { buildViews } from "./view.js";

import { makeViteLogger } from "../logger.js";

const cwd = process.cwd();

export function build() {
  return Effect.gen(function* () {
    const inline_config = yield* Effect.tryPromise(() => Config.load(cwd));

    const user_config = yield* Config.parse(inline_config);

    let merged_config = yield* Effect.promise(() => {
      return runConfigSetup(user_config);
    });

    const logger = yield* makeViteLogger();

    const shared_vite_config = makeVite(merged_config, {
      logger,
      mode: "build",
    });

    const config = { ...merged_config, vite: shared_vite_config };

    const resolved_config = yield* Effect.tryPromise(() => {
      return Config.preprocess(config, { cwd });
    });

    yield* Effect.tryPromise(() => {
      return runConfigResolved(resolved_config);
    });

    const outDir = path.join(cwd, resolved_config.build.outDir);

    const mode = process.env.NODE_ENV ?? "production";
    const env = load(resolved_config.env.dir ?? cwd, mode);
    const env_ = partition(env, resolved_config.env.publicPrefix);

    yield* Effect.tryPromise(() => fs.remove(outDir));

    yield* Effect.log("building views...");

    const opts = { cwd, outDir, config: resolved_config, env: env_.public };
    const views = yield* buildViews(opts);

    yield* Effect.log("building server...");

    defineServerEnv(env);

    yield* Effect.promise(() => {
      return buildServer(views, { env, outDir, config: resolved_config });
    });

    yield* Effect.log("✔︎ build done");
  });
}
