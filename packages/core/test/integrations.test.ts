import { run } from "effection";
import { join } from "node:path";
import { it, expect } from "vitest";
import {
  ConsoleTransport,
  ContextLogger,
  Logger as SimpleLogger,
} from "@jamx/logger";

import { Config, Integration } from "../src/core/config";
import {
  has_html_integrations,
  has_integrations,
  run_build_end,
  run_build_start,
  run_config_resolved,
  run_config_setup,
  run_html_post_transform,
  run_html_pre_transform,
} from "../src/core/integrations/hooks";
import { Logger, TextFormatter } from "../src/core/logger";

const logger = new ContextLogger(
  new SimpleLogger({ transport: new ConsoleTransport(new TextFormatter()) }),
);

it("should run lifecycle and HTML hooks for environment integrations", async () => {
  const calls: string[] = [];
  const integration: Integration = {
    name: "client-only",
    config() {
      calls.push("config");
      return { build: { minify: false } };
    },
    configResolved() {
      calls.push("configResolved");
    },
    buildStart() {
      calls.push("buildStart");
    },
    buildEnd() {
      calls.push("buildEnd");
    },
    transform: {
      order: "pre",
      handle(code) {
        calls.push("pre");
        return `${code}-pre`;
      },
    },
  };
  const loader = new Config(
    process.cwd(),
    join(process.cwd(), "test/fixtures/default-config.js"),
  );

  const result = await run(function* () {
    yield* Logger.set(logger);
    const config = yield* loader.load("build");
    config.environments.client = { vite: {}, integrations: [integration] };

    const merged = yield* run_config_setup(config, { command: "build" });
    yield* run_config_resolved(merged);
    yield* run_build_start(merged);
    yield* run_build_end(merged, {});
    const transformed = yield* run_html_pre_transform(merged, {
      code: "view",
      filename: "view.svelte",
    });

    return {
      merged,
      transformed,
      hasIntegrations: has_integrations(merged),
      hasHtmlIntegrations: has_html_integrations(merged),
    };
  });

  expect(result.merged.build.minify).toBe(false);
  expect(result.transformed).toBe("view-pre");
  expect(result.hasIntegrations).toBe(true);
  expect(result.hasHtmlIntegrations).toBe(true);
  expect(calls).toEqual([
    "config",
    "configResolved",
    "buildStart",
    "buildEnd",
    "pre",
  ]);
});

it("should run post transforms for environment integrations", async () => {
  const loader = new Config(
    process.cwd(),
    join(process.cwd(), "test/fixtures/default-config.js"),
  );
  const result = await run(function* () {
    yield* Logger.set(logger);
    const config = yield* loader.load("build");
    config.environments.client = {
      vite: {},
      integrations: [
        {
          name: "client-post",
          transform: {
            order: "post",
            handle(code) {
              return `${code}-post`;
            },
          },
        },
      ],
    };

    return yield* run_html_post_transform(config, {
      code: "view",
      filename: "view.svelte",
    });
  });

  expect(result).toBe("view-post");
});
