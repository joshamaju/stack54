import * as path from "node:path";

import fs from "fs-extra";

import { call } from "effection";
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

const cwd = process.cwd();

export function* build() {
  const start = performance.now();

  const console = useLogger();

  const inline_config = yield* call(Config.load(cwd));

  const user_config = Config.parse(inline_config);

  let merged_config = yield* call(
    runConfigSetup(user_config, { command: "build" })
  );

  const resolved_config = yield* call(
    Config.preprocess(merged_config, { cwd })
  );

  const logger = makeViteLogger();

  const shared_vite_config = makeVite(resolved_config, {
    logger,
    mode: "build",
  });

  const config = { ...resolved_config, vite: shared_vite_config };

  yield* call(runConfigResolved(config));

  const outDir = path.join(cwd, config.build.outDir);

  const mode = process.env.NODE_ENV ?? "production";

  const env = load(config.env.dir ?? cwd, mode);
  const { public: public_ } = partition(env, config.env.publicPrefix);

  yield* call(fs.remove(outDir));

  yield* call(runBuildStart(config));

  console.info("building views...");

  const opts = { cwd, outDir, config: config, env: public_ };

  const views = yield* buildViews(opts);

  console.info("building server...");

  defineServerEnv(env);

  yield* call(buildServer(views, { env, outDir, config }));

  yield* call(runBuildEnd(config));

  const time = performance.now() - start;

  console.info(`✔︎ build done in ${Math.round(time)} ${color.dim("ms")}`);
}
