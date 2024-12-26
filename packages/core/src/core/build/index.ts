import * as fs from "node:fs/promises";
import * as path from "node:path";

import { call, spawn } from "effection";

import * as Config from "../config/index.js";
import { defineServerEnv, load, partition } from "../env.js";
import {
  runBuildEnd,
  runBuildStart,
  runConfigResolved,
  runConfigSetup,
} from "../integrations/hooks.js";
import { useLogger } from "../logger.js";
import { displayTime } from "../utils/index.js";
import { makeVite } from "../utils/vite.js";
import { buildServer } from "./server.js";
import { buildViews } from "./view.js";

export function* build() {
  const start = process.hrtime.bigint();

  const cwd = process.cwd();

  const logger = useLogger();

  logger.info("loading configuration");

  const inline_config = yield* call(Config.load(cwd));

  const user_config = Config.parse(inline_config);

  let merged_config =
    user_config.integrations.length <= 0
      ? user_config
      : yield* call(runConfigSetup(user_config, { command: "build" }));

  const resolved_config = yield* call(
    Config.preprocess(merged_config, { cwd })
  );

  const shared_vite_config = makeVite(resolved_config, { mode: "build" });

  const config = { ...resolved_config, vite: shared_vite_config };

  if (config.integrations.length > 0) {
    yield* call(runConfigResolved(config));
  }

  const outDir = path.join(cwd, config.build.outDir);

  const clean = yield* spawn(function* () {
    yield* call(fs.rm(outDir, { recursive: true, force: true }));
  });

  if (config.integrations.length > 0) {
    yield* call(runBuildStart(config));
  }

  yield* clean;

  const mode = process.env.NODE_ENV ?? "production";

  const env = load(config.env.dir ?? cwd, mode);
  const { public: public_ } = partition(env, config.env.publicPrefix);

  const opts = { cwd, outDir, config, env: public_ };

  const views = yield* buildViews(opts);

  defineServerEnv(env);

  yield* call(buildServer(views, { env, outDir, config }));

  if (config.integrations.length > 0) {
    yield* call(runBuildEnd(config));
  }

  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1e6;

  logger.info(`✔︎ build done in ${displayTime(Math.round(time))}`);
}
