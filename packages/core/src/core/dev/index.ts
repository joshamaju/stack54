import color from "kleur";
import {
  createServer,
  type InlineConfig,
  mergeConfig,
  ViteDevServer,
} from "vite";

import * as path from "node:path";

import { call, createSignal, each, resource, spawn, suspend } from "effection";

import { Config, config_file } from "../config/index.js";
import { define, load } from "../env.js";
import {
  run_config_resolved,
  run_config_setup,
} from "../integrations/hooks.js";
import { use_logger } from "../logger.js";
import { Command, EntryOption } from "../types.js";
import { array } from "../utils/index.js";
import { make_vite_config } from "../utils/vite.js";
import { attach_full_path } from "./attach-full-path/index.js";
import { live_reload_plugin } from "./live-reload-plugin/index.js";
import { resolve_inline_imports_plugin } from "./resolve-inline-imports-plugin/index.js";

const command: Command = "serve";

export function start_server({
  cwd,
  port,
  config_file,
}: EntryOption & { port?: number }) {
  return resource<ViteDevServer>(function* (provide) {
    const conf = new Config(cwd, config_file);

    const user_config = yield* call(() => conf.load(command));

    user_config.integrations = [
      ...(user_config.integrations ?? []),
      live_reload_plugin(),
    ];

    let merged_config = yield* run_config_setup(user_config, { command });

    let { assetPrefix } = user_config.build;

    if (assetPrefix) {
      try {
        const path = new URL(assetPrefix).pathname;
        assetPrefix = path;
      } catch (error) {
        assetPrefix = "";
      }
    }

    merged_config.svelte.preprocess = [
      ...array(merged_config.svelte.preprocess ?? []),
      attach_full_path({ assetPrefix }),
    ];

    merged_config.vite.plugins = [
      ...(merged_config.vite.plugins ?? []),
      resolve_inline_imports_plugin(),
    ];

    const resolved_config = yield* call(() => conf.resolve(merged_config));

    /**
     * We turn this off because our internal preprocessors i.e attach-actual-path get svelte style tag content
     * as component markup, which is weird. Hopefully there's a fix for this.
     *
     * Take for example
     *
     * ```svelte
     * <script lang="ts">
     *   export let name: string;
     * </script>
     *
     * <p>{name}</p>
     *
     * <style>
     *   p {
     *     color: red;
     *   }
     * </style>
     * ```
     *
     * We get the processed (minified) content of the style tag instead of the `p` tag. So the
     * following preprocessor markup hook gets the style tag content instead.
     *
     * ```ts
     * const my_preprocessor = {
     *   name: "my-preprocessor",
     *   markup({ content }) {
     *     // content is the style tag contents
     *   }
     * };
     * ```
     */
    resolved_config.svelte.emitCss = false;

    const mode = process.env.NODE_ENV ?? "development";

    const shared_vite_config = make_vite_config(resolved_config, {
      mode,
      command,
    });

    const env = load(resolved_config.env.dir ?? cwd, mode);

    const internal_vite_config: InlineConfig = {
      build: { rollupOptions: { input: resolved_config.entry } },
      define: define(env),
    };

    const envs = resolved_config.environments;

    const vite_config = mergeConfig(
      mergeConfig(resolved_config.vite, envs.client?.vite ?? {}),
      envs.server?.vite ?? {},
    );

    const config: typeof merged_config = {
      ...resolved_config,
      vite: mergeConfig(
        mergeConfig(vite_config, shared_vite_config),
        internal_vite_config,
      ),
    };

    config.vite.server ??= {};
    config.vite.server.cors ??= false;
    config.vite.server.port = port ?? config.vite.server.port ?? 8080;

    yield* run_config_resolved(config);

    const server = yield* call(() => createServer(config.vite));

    yield* call(() => server.listen());

    try {
      yield* provide(server);
    } finally {
      yield* call(() => server.close());
    }
  });
}

// const STACK_CONFIG_FILES = new Set([
//   "stack.config.js",
//   "stack.config.ts",
//   "stack.config.mjs",
//   "stack.config.mts",
// ]);

function is_restart_target(file: string, config_file: string) {
  // const basename = path.basename(file);

  // if (basename.startsWith(".env")) return true;
  // if (STACK_CONFIG_FILES.has(basename)) return true;

  return path.resolve(file) === config_file;
}

export function* dev(args: EntryOption & { port?: number }) {
  let initial = true;
  const logger = use_logger();
  const channel = createSignal<string>();

  const filename = config_file(args.cwd, args.config_file);

  const fn = (file: string) => {
    if (is_restart_target(file, filename)) {
      channel.send("restart");
    }
  };

  function* runner() {
    const start = performance.now();

    const server = yield* start_server({ ...args, config_file: filename });

    const time = performance.now() - start;

    logger.info(`server ready in ${Math.round(time)} ${color.dim("ms")}`);

    server.watcher.on("change", fn);
    server.watcher.on("unlink", fn);
    server.watcher.on("add", fn);

    server.restart = async function () {
      channel.send("restart");
    };

    if (initial) {
      console.log();
      server.printUrls();
    }

    server.bindCLIShortcuts({
      print: initial,
      customShortcuts: [
        {
          key: "r",
          description: "restart server",
          action() {
            channel.send("restart");
          },
        },
      ],
    });

    if (initial) {
      console.log();
      logger.info("watching for changes...");
    }

    try {
      yield* suspend();
    } finally {
      server.watcher.off("change", fn);
    }
  }

  function catcher(error: any) {
    if (error instanceof Error && error.message == "halted") return;
    throw error;
  }

  let task = yield* spawn(runner);

  task.catch(catcher);

  yield* spawn(function* () {
    for (const event of yield* each(channel)) {
      if (event === "restart") {
        initial = false;
        logger.info("restarting...");
        yield* task.halt();
        task = yield* spawn(runner);
        task.catch(catcher);
      }

      yield* each.next();
    }
  });

  try {
    yield* suspend();
  } finally {
    logger.info("stopping server...");
    yield* task.halt();
    logger.info("stopped server");
  }
}
