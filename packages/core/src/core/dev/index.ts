import * as vite from "vite";
import color from "kleur";

import * as Config from "../config/index.js";
import { InvalidConfig, UserConfig } from "../config/index.js";
import { defineServerEnv, load } from "../env.js";
import { runConfigResolved, runConfigSetup } from "../integrations/hooks.js";
import { arraify } from "../utils/index.js";
import { makeVite } from "../utils/vite.js";
import { hotReloadPlugin } from "../vite-plugin-hot-reload/index.js";
import { integrationsPlugin } from "../vite-plugin-integrations/index.js";
import { attachFullPath } from "./preprocess/index.js";
import * as Log from "../logger.js";
import { formatConfigErrorMessage } from "../message.js";

const cwd = process.cwd();

export async function dev() {
  const devStart = performance.now();

  const inline_config = await Config.load(cwd);

  const user_config = await Config.parse(inline_config ?? ({} as UserConfig));

  if (user_config instanceof InvalidConfig) {
    Log.error(formatConfigErrorMessage(user_config.cause));
    process.exit(1);
  }

  let merged_config = await runConfigSetup(user_config);

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

  const resolved_config = await Config.preprocess(config, { cwd });

  await runConfigResolved(resolved_config);

  const mode = process.env.NODE_ENV ?? "development";
  const env = load(resolved_config.env.dir ?? cwd, mode);

  defineServerEnv(env);

  const server = await vite.createServer(config.vite);

  await server.listen();

  server.printUrls();

  console.log(color.dim("---"));

  const time = performance.now() - devStart;

  Log.info(`server ready in ${Math.round(time)} ${color.dim("ms")}`);
  Log.info("watching for changes...");

  return {
    async shutdown() {
      await server.close();
    },
  };
}
