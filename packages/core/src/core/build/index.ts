import * as fs from "node:fs/promises";
import * as path from "node:path";

import { call, spawn } from "effection";

import * as Config from "../config/index.js";
import { load } from "../env.js";
import {
  run_build_end,
  run_build_start,
  run_config_resolved,
  run_config_setup,
} from "../integrations/hooks.js";
import { use_logger } from "../logger.js";
import { display_time } from "../utils/index.js";
import { make_vite_config } from "../utils/vite.js";
import { builder } from "./build.js";

export function* build() {
  const start = process.hrtime.bigint();

  const cwd = process.cwd();

  const logger = use_logger();

  logger.info("loading configuration");

  const inline_config = yield* call(() => Config.load(cwd));

  const user_config = Config.parse(inline_config);

  let merged_config =
    user_config.integrations.length <= 0
      ? user_config
      : yield* call(() => run_config_setup(user_config, { command: "build" }));

  const resolved_config = yield* call(
    Config.preprocess(merged_config, { cwd })
  );

  const mode = process.env.NODE_ENV ?? "production";

  const shared_vite_config = make_vite_config(resolved_config, {
    mode,
    command: "build",
  });

  const config = { ...resolved_config, vite: shared_vite_config };

  const outDir = path.join(cwd, config.build.outDir);

  const clean = yield* spawn(function* () {
    yield* call(() => fs.rm(outDir, { recursive: true, force: true }));
  });

  if (config.integrations.length > 0) {
    yield* call(() => run_config_resolved(config));
  }

  const env = load(config.env.dir ?? cwd, mode);

  if (config.integrations.length > 0) {
    yield* call(run_build_start(config));
  }

  yield* clean;

  yield* builder({ cwd, outDir, config, env });

  if (config.integrations.length > 0) {
    yield* call(() => run_build_end(config));
  }

  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1e6;

  logger.info(`✔︎ build done in ${display_time(Math.round(time))}`);
}
