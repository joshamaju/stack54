import { call, Operation, useScope } from "effection";
import { Plugin } from "vite";

import type { Processed } from "svelte/compiler";
import * as compiler from "svelte/compiler";

import { ResolvedConfig } from "../../config/index.js";
import {
  run_html_post_transform,
  run_html_pre_transform,
} from "../../integrations/hooks.js";

export function* integrations_container_plugin(
  config: ResolvedConfig,
): Operation<Plugin> {
  const scope = yield* useScope();

  return {
    apply: "serve",
    name: "stack54:integrations",
    async configureServer(server) {
      const callbacks = await Promise.all(
        config.integrations.map(async (integration) => {
          const plugin =
            integration instanceof Promise ? await integration : integration;
          return plugin.configureServer?.call(plugin, server);
        }),
      );

      return () => {
        callbacks.forEach((fn) => fn?.());
      };
    },
    transform: {
      order: "pre",
      async handler(code, filename) {
        return scope.run(function* () {
          const preprocessors = config.svelte.preprocess ?? [];

          const processed: Processed = yield* call(() =>
            compiler.preprocess(code, preprocessors, { filename }),
          );

          const pre = yield* run_html_pre_transform(config, {
            code: processed.code,
            filename,
          });

          return yield* run_html_post_transform(config, {
            filename,
            code: pre,
          });
        });
      },
    },
  };
}
