import sade from "sade";

import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { run } from "effection";

import { InvalidConfig } from "./config/index.js";
import { useLogger } from "./logger.js";
import { formatConfigErrorMessage } from "./message.js";

const pkg_path = fileURLToPath(new URL("../../package.json", import.meta.url));

const pkg = JSON.parse(fs.readFileSync(pkg_path, "utf-8"));

const program = sade("stack54-cli").version(pkg.version);

program.command("dev").action(async () => {
  const { dev } = await import("./dev/index.js");

  const task = run(dev);

  const close = () => task.halt();

  const shutdown = async () => {
    await close();
    process.exit(0);
  };

  process.on("unhandledRejection", async (error) => {
    console.log(error);
    await close();
    process.exit(1);
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});

program.command("build").action(async () => {
  const { build } = await import("./build/index.js");

  const task = run(function* () {
    const logger = yield* useLogger();

    try {
      yield* build();
    } catch (error) {
      if (error instanceof InvalidConfig) {
        logger.error(formatConfigErrorMessage(error.cause));
        return;
      }

      logger.error(error);
    }
  });

  const shutdown = async () => {
    await task.halt();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});

program.parse(process.argv);
