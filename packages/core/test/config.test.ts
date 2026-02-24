import { run } from "effection";
import { join } from "node:path";
import { it, expect } from "vitest";
import { Logger as TSLogger, ILogObj } from "tslog";

import { merge } from "../src/core/config/merge";
import { Config, UserConfig } from "../src/core/config";
import { Logger } from "../src/core/logger";

const logger = new TSLogger<ILogObj>({ type: "hidden" });

it("should load config", async () => {
  const file = "./test/fixtures/default-config.js";
  const loader = new Config(process.cwd(), file);

  const config = await run(function* () {
    yield* Logger.set(logger);
    return yield* loader.load("build");
  });

  expect(config).toMatchObject({ entry: "./stub-entry.js" });
});

it("should resolve config with glob entry", async () => {
  const cwd = join(process.cwd(), "test/fixtures");
  const loader = new Config(cwd, join(cwd, "./glob-config.js"));

  const config = await run(function* () {
    yield* Logger.set(logger);
    return yield* loader.resolve(yield* loader.load("build"));
  });

  expect(config).toMatchObject({ entry: "stub-entry.js" });
});

it("should merge configs", () => {
  const _default: UserConfig = {
    views: ["src/views/**/*.svelte"],
    build: {
      minify: true,
    },
    vite: {
      plugins: [{ name: "default" }],
    },
  };

  const override: UserConfig = {
    views: ["src/pages/**/*.svelte"],
    build: {
      minify: false,
    },
    vite: {
      plugins: [{ name: "override" }],
    },
  };

  const merged = merge(_default, override);

  expect(merged).toMatchObject({
    build: { minify: false },
    views: ["src/views/**/*.svelte", "src/pages/**/*.svelte"],
    vite: {
      plugins: [{ name: "default" }, { name: "override" }],
    },
  });
});
