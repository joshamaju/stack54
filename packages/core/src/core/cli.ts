import sade from "sade";

import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { Effect, Exit, Fiber, Logger, LogLevel, Scope, Cause } from "effect";

import { InvalidConfig } from "./config/index.js";
import { simpleLogger } from "./logger.js";
import { formatConfigErrorMessage } from "./message.js";

const log_config_error = (e: InvalidConfig) => {
  return Effect.logError(formatConfigErrorMessage(e.cause));
};

const layer = Logger.replace(Logger.defaultLogger, simpleLogger);

const pkg_path = fileURLToPath(new URL("../../package.json", import.meta.url));

const pkg = JSON.parse(fs.readFileSync(pkg_path, "utf-8"));

const program = sade("stack54-cli").version(pkg.version);

program.command("dev").action(async () => {
  const { dev } = await import("./dev/index.js");

  const scope = Effect.runSync(Scope.make());

  dev().pipe(
    Effect.catchTag("InvalidConfig", (e) => log_config_error(e)),
    Effect.catchAllCause((c) => Effect.logError(Cause.prettyErrors(c))),
    Effect.provide(layer),
    Scope.extend(scope),
    Effect.runFork
  );

  const events = ["SIGINT", "SIGTERM"] as const;

  // process.on("SIGINT", async () => {
  //   console.log(`\n${color.dim("---")}`);
  //   await Effect.runPromise(Scope.close(scope, Exit.void));
  //   process.exit(0);
  // });

  const close = () => Effect.runPromise(Scope.close(scope, Exit.void));

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

  const fiber = build().pipe(
    Effect.catchTag("InvalidConfig", (e) => log_config_error(e)),
    Effect.catchAllCause((c) => Effect.logError(Cause.prettyErrors(c))),
    Logger.withMinimumLogLevel(LogLevel.All),
    Effect.provide(layer),
    Effect.runFork
  );

  const shutdown = async () => {
    await Effect.runPromise(Fiber.interrupt(fiber));
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});

program.parse(process.argv);
