import sade from "sade";
import color from "kleur";

import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { run } from "effection";

import { InvalidConfig } from "./config/index.js";
import { useLogger } from "./logger.js";
import { formatConfigErrorMessage } from "./message.js";

const pkg_path = fileURLToPath(new URL("../../package.json", import.meta.url));

const pkg = JSON.parse(fs.readFileSync(pkg_path, "utf-8"));

const program = sade("stack54-cli").version(pkg.version);

const logger = useLogger();

const handle_error = (error: unknown) => {
  if (error instanceof InvalidConfig) {
    logger.error(formatConfigErrorMessage(error.cause));
  } else if ((error as any).name == "ParseError") {
    const { frame, start, filename } = error as any;
    logger.error(`[ParseError] ${filename}:${start.line}:${start.column}`);
    console.log(color.red(frame));
  } else {
    logger.error(error);
  }

  console.log();

  process.exit(1);
};

program.command("dev").action(async () => {
  const { dev } = await import("./dev/index.js");

  const task = run(function* () {
    try {
      yield* dev();
    } catch (error) {
      handle_error(error);
    }
  });

  const close = () => task.halt();

  const shutdown = async () => {
    await close();
    process.exit(0);
  };

  process.on("unhandledRejection", async (error) => {
    logger.error(error);
    await close();
    process.exit(1);
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});

program.command("build").action(async () => {
  const { build } = await import("./build/index.js");

  const task = run(function* () {
    try {
      yield* build();
    } catch (error) {
      handle_error(error);
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
