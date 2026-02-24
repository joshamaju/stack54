import {
  createServer,
  type InlineConfig,
  mergeConfig,
  ViteDevServer,
} from "vite";

import * as path from "node:path";

import { call, suspend, useScope } from "effection";

import {
  ActorRef,
  assign,
  createActor,
  createMachine,
  fromCallback,
  fromPromise,
  stopChild,
} from "xstate";
import {
  Config,
  config_file,
  resolve,
  ResolvedConfig,
} from "../config/index.js";
import { define, load } from "../env.js";
import {
  run_config_resolved,
  run_config_setup,
} from "../integrations/hooks.js";
import { use_logger } from "../logger.js";
import { Command, EntryOption } from "../types.js";
import { clearScreen } from "../utils/console.js";
import { array } from "../utils/index.js";
import { make_vite_config } from "../utils/vite.js";
import { attach_full_path } from "./attach-full-path/index.js";
import { live_reload_plugin } from "./live-reload-plugin/index.js";
import { resolve_inline_imports_plugin } from "./resolve-inline-imports-plugin/index.js";

const command: Command = "serve";

export function* setup(
  user_config: ResolvedConfig,
  { cwd, port }: { cwd: string; port?: number },
) {
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

  const resolved_config = yield* resolve(merged_config, cwd);

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

  return config;
}

type Context = {
  started: boolean;
  server?: ViteDevServer;
  config?: ResolvedConfig;
  user_config?: ResolvedConfig;
  watcher?: ActorRef<any, any>;
};

const machine = createMachine({
  initial: "load",
  context: { started: false },
  types: {} as {
    context: Context;
    events: { type: "start" } | { type: "restart"; reload?: boolean };
  },
  on: {
    restart: [
      {
        target: ".load",
        guard: ({ event }) => event.reload == true,
        actions: "log_restart",
      },
      {
        target: ".setup",
        actions: "log_restart",
      },
    ],
  },
  states: {
    load: {
      invoke: {
        src: "config",
        onDone: {
          target: "setup",
          actions: assign({
            user_config: ({ event }) => event.output,
            started: false,
          }),
        },
      },
    },
    setup: {
      invoke: {
        src: "setup",
        input: ({ context }) => context.user_config,
        onDone: {
          target: "create",
          actions: [
            assign({ config: ({ event }) => event.output }),
            stopChild("watcher"),
          ],
        },
      },
    },
    create: {
      invoke: {
        src: "create",
        input: ({ context }) => context,
        onDone: {
          target: "listen",
          actions: assign({ server: ({ event }) => event.output }),
        },
      },
    },
    listen: {
      exit: assign({ started: true }),
      entry: assign({
        watcher: ({ spawn, context }) => {
          return spawn("watcher", { id: "watcher", input: context });
        },
      }),
      invoke: {
        src: "listen",
        input: ({ context }) => context,
      },
    },
  },
});

function is_restart_target(file: string, config_file: string) {
  return path.resolve(file) === config_file;
}

export function* dev(args: EntryOption & { port?: number }) {
  const logger = yield* use_logger();

  const filename = config_file(args.cwd, args.config_file);

  const scope = yield* useScope();

  const actor = createActor(
    machine.provide({
      actions: {
        log_restart() {
          logger.info("restarting...");
        },
      },
      actors: {
        config: fromPromise(async () => {
          const conf = new Config(args.cwd, filename);
          return scope.run(() => conf.load(command));
        }),
        setup: fromPromise(({ input }: { input: ResolvedConfig }) => {
          return scope.run(() => setup({ ...input }, args));
        }),
        create: fromPromise(async ({ input }: { input: Context }) => {
          const { config, server } = input;

          if (server) {
            logger.debug("stopping server");
            await server.watcher.close();
            await server.close();
          }

          return createServer(config?.vite);
        }),
        listen: fromPromise(async ({ input }: { input: Context }) => {
          const { server, started } = input;

          await server?.listen(undefined, started);

          logger.info("server ready");

          if (!started) {
            console.log();
            server!.printUrls();
          }
        }),
        watcher: fromCallback<any, Context>(({ input, sendBack }) => {
          const { server, started } = input;

          server?.bindCLIShortcuts({
            print: !started,
            customShortcuts: [
              {
                key: "r",
                description: "restart server",
                action() {
                  sendBack({ type: "restart" });
                },
              },
            ],
          });

          const fn = (file: string) => {
            if (is_restart_target(file, filename)) {
              sendBack({ type: "restart", reload: file == filename });
            }
          };

          server?.watcher.on("change", fn);
          server?.watcher.on("unlink", fn);
          server?.watcher.on("add", fn);

          console.log();
          logger.info("watching for changes...");

          server!.restart = async function () {
            sendBack({ type: "restart" });
          };
        }),
      },
    }),
  );

  logger.info("starting dev server");

  actor.start();

  try {
    yield* suspend();
  } finally {
    clearScreen();
    logger.info("stopping server...");
    const { context } = actor.getSnapshot();
    yield* call(() => context.server?.close());
    actor.stop();
    logger.info("stopped server");
  }
}
