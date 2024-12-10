import * as path from "node:path";

import fs from "fs-extra";

import { call, all } from "effection";
import color from "kleur";

import * as Config from "../config/index.js";
import { defineServerEnv, load, partition } from "../env.js";
import {
  runBuildEnd,
  runBuildStart,
  runConfigResolved,
  runConfigSetup,
} from "../integrations/hooks.js";
import { makeViteLogger, useLogger } from "../logger.js";
import { makeVite } from "../utils/vite.js";
import { buildServer } from "./server.js";
import { buildViews } from "./view.js";

export function* build() {
  const start = performance.now();

  const cwd = process.cwd();

  const logger = useLogger();

  const inline_config = yield* call(Config.load(cwd));

  const user_config = Config.parse(inline_config);

  let merged_config = yield* call(
    runConfigSetup(user_config, { command: "build" })
  );

  const resolved_config = yield* call(
    Config.preprocess(merged_config, { cwd })
  );

  const vite_logger = makeViteLogger();

  const shared_vite_config = makeVite(resolved_config, {
    logger: vite_logger,
    mode: "build",
  });

  const config = { ...resolved_config, vite: shared_vite_config };

  yield* call(runConfigResolved(config));

  const outDir = path.join(cwd, config.build.outDir);

  yield* all([call(fs.remove(outDir)), call(runBuildStart(config))]);

  const mode = process.env.NODE_ENV ?? "production";

  const env = load(config.env.dir ?? cwd, mode);
  const { public: public_ } = partition(env, config.env.publicPrefix);

  const opts = { cwd, outDir, config: config, env: public_ };

  logger.info("building views...");

  const views = yield* buildViews(opts);

  logger.info("building server...");

  defineServerEnv(env);

  yield* call(buildServer(views, { env, outDir, config }));

  yield* call(runBuildEnd(config));

  const time = performance.now() - start;

  logger.info(`✔︎ build done in ${Math.round(time)} ${color.dim("ms")}`);
}
