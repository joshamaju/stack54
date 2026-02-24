import * as fs from "node:fs/promises";
import * as path from "node:path";

import { call, spawn } from "effection";

import { Config, config_file } from "../config/index.js";
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
import { Command, EntryOption } from "../types.js";

export function* build({ cwd, ..._ }: EntryOption) {
  const logger = yield* use_logger();

  logger.info("loading configuration");

  const start = process.hrtime.bigint();

  const filename = config_file(cwd, _.config_file);

  const conf = new Config(cwd, filename);

  const command: Command = "build";
  const user_config = yield* call(() => conf.load(command));

  let merged_config =
    user_config.integrations.length <= 0
      ? user_config
      : yield* run_config_setup(user_config, { command });

  const resolved_config = yield* call(() => conf.resolve(merged_config));

  const mode = process.env.NODE_ENV ?? "production";

  const shared_vite_config = make_vite_config(resolved_config, {
    mode,
    command,
  });

  const config = { ...resolved_config, vite: shared_vite_config };

  const outDir = path.join(cwd, config.build.outDir);

  const clean = yield* spawn(function* () {
    yield* call(() => fs.rm(outDir, { recursive: true, force: true }));
  });

  const { integrations } = config;

  if (integrations.length > 0) {
    yield* run_config_resolved(config);
  }

  const env = load(config.env.dir ?? cwd, mode);

  if (integrations.length > 0) {
    yield* run_build_start(config);
  }

  yield* clean;

  const manifest = yield* builder({ cwd, outDir, config, env });

  if (integrations.length > 0) {
    yield* run_build_end(config, manifest);
  }

  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1e6;

  logger.info(`✔︎ build done in ${display_time(Math.round(time))}`);
}
