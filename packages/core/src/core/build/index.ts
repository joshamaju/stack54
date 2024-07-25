import * as path from "node:path";

import fs from "fs-extra";

import * as Config from "../config/index.js";
import { InvalidConfig, UserConfig } from "../config/index.js";
import { runConfigResolved, runConfigSetup } from "../integrations/hooks.js";
import { makeVite } from "../utils/vite.js";
import { buildViews } from "./client/index.js";
import { defineServerEnv, load, partition } from "../env.js";
import { buildServer } from "./server.js";

import * as Log from "../logger.js";

// const url = fileURLToPath(new URL("./", import.meta.url));

// console.log("\n", url);

const cwd = process.cwd();

export async function build() {
  const inline_config = await Config.load(cwd);

  const user_config = await Config.parse(inline_config ?? ({} as UserConfig));

  if (user_config instanceof InvalidConfig) {
    Log.error("Invalid config");
    process.exit(1);
  }

  let merged_config = await runConfigSetup(user_config);

  const shared_vite_config = makeVite(merged_config, { mode: "build" });

  const config = { ...merged_config, vite: shared_vite_config };

  const resolved_config = await Config.preprocess(config, { cwd });

  await runConfigResolved(resolved_config);

  const outDir = path.join(cwd, resolved_config.build.outDir);

  const mode = process.env.NODE_ENV ?? "production";
  const env = load(resolved_config.env.dir ?? cwd, mode);
  const env_ = partition(env, resolved_config.env.publicPrefix);

  fs.removeSync(outDir);

  Log.info("Building views");

  const built_views = await buildViews({
    cwd,
    outDir,
    env: env_.public,
    config: resolved_config,
  });

  Log.info(`Built ${built_views.size} views`);

  Log.info("Building server");

  defineServerEnv(env);

  await buildServer(built_views, { env, outDir, config: resolved_config });

  Log.info("Server build done");
}
