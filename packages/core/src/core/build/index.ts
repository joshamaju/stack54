import * as fs from "node:fs/promises";
import * as path from "node:path";

import { call, spawn } from "effection";

import * as Config from "../config/index.js";
import { defineServerEnv, load, partition } from "../env.js";
import {
  run_build_end,
  run_build_start,
  run_config_resolved,
  run_config_setup,
} from "../integrations/hooks.js";
import { use_logger } from "../logger.js";
import { display_time } from "../utils/index.js";
import { make_vite_config } from "../utils/vite.js";
import { build_server } from "./server.js";
import { build_views } from "./view.js";

export function* build() {
  const start = process.hrtime.bigint();

  const cwd = process.cwd();

  const logger = use_logger();

  logger.info("loading configuration");

  const inline_config = yield* call(Config.load(cwd));

  const user_config = Config.parse(inline_config);

  let merged_config =
    user_config.integrations.length <= 0
      ? user_config
      : yield* call(run_config_setup(user_config, { command: "build" }));

  const resolved_config = yield* call(
    Config.preprocess(merged_config, { cwd })
  );

  const shared_vite_config = make_vite_config(resolved_config, {
    mode: "build",
  });

  const config = { ...resolved_config, vite: shared_vite_config };

  if (config.integrations.length > 0) {
    yield* call(run_config_resolved(config));
  }

  const outDir = path.join(cwd, config.build.outDir);

  const clean = yield* spawn(function* () {
    yield* call(fs.rm(outDir, { recursive: true, force: true }));
  });

  if (config.integrations.length > 0) {
    yield* call(run_build_start(config));
  }

  yield* clean;

  const mode = process.env.NODE_ENV ?? "production";

  const env = load(config.env.dir ?? cwd, mode);
  const { public: public_ } = partition(env, config.env.publicPrefix);

  const opts = { cwd, outDir, config, env: public_ };

  const views = yield* build_views(opts);

  defineServerEnv(env);

  yield* call(build_server(views, { env, outDir, config }));

  if (config.integrations.length > 0) {
    yield* call(run_build_end(config));
  }

  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1e6;

  logger.info(`✔︎ build done in ${display_time(Math.round(time))}`);
}
