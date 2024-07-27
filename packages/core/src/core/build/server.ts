import * as path from "node:path";

import type { Plugin } from "vite";
import * as vite from "vite";

import { ResolvedConfig } from "../config/index.js";
import { define, Env } from "../env.js";
import { parse_id } from "../utils/view.js";
import { Output } from "./types.js";

type Opts = { config: ResolvedConfig; outDir: string; env: Env };

export async function buildServer(
  modules: Map<string, Output>,
  { env, config, outDir }: Opts
) {
  // We substitute the original svelte file with our preprocessed html version
  const resolve: Plugin = {
    name: "stack54:facade-resolver",
    load(id) {
      const req = parse_id(id);
      const module = modules.get(req.filename);
      if (module) return module.code;
    },
  };

  const env_define = define(env);

  const inline_config: vite.InlineConfig = {
    define: env_define,
    plugins: [resolve],
    mode: "production",
    build: {
      ssr: true,
      // target: "esnext",
      ssrEmitAssets: true,
      minify: config.build.minify,
      outDir: path.join(outDir, "server"),
      rollupOptions: {
        // output: { format: "esm" },
        input: { index: config.entry },
        // preserveEntrySignatures: "exports-only",
      },
    },
  };

  await vite.build(vite.mergeConfig(config.vite, inline_config));
}
